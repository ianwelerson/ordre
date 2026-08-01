import { getDb } from '#/config/db-context.ts';
import { logger } from '#/config/logger.ts';
import type { WorkspaceMemberContext } from '#/types/context.ts';
import { isUniqueViolation } from '#/utils/db-error.ts';
import { validateField, validateRequestBody } from '#/utils/validation.ts';
import { eq, sql } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import z from 'zod';

import { BASE_ERRORS, errorResponse, WORKSPACE_ERRORS } from '@ordre/core/errors';
import { WorkspaceCreateSchema, WorkspaceUpdateSchema } from '@ordre/core/schemas';
import type {
  NoContentResponse,
  Response,
  Workspace,
  WorkspaceCreate,
  WorkspaceSummary,
  WorkspaceUpdate,
} from '@ordre/core/types';
import * as schema from '@ordre/db/schemas';

import {
  checkSlugAvailability,
  findActivePlan,
  findUserWorkspaces,
  findWorkspace,
  respondWithWorkspace,
  toWorkspaceResponse,
} from './workspace.utils.ts';

/**
 * Checks whether a workspace slug is already taken.
 *
 * The raw input is run through the same `slug` transform `workspaceCreate` uses,
 * so the availability answer matches what would actually be stored (e.g.
 * `"My Workspace"` is checked as `"my-workspace"`). Returns `INVALID_INPUT` when
 * the slug fails validation rather than reporting it as available.
 *
 * @param slug - The candidate slug, before normalization.
 * @returns `{ exists: boolean }` on success, or an error response.
 */
export const workspaceSlugExists = async (
  slug: unknown
): Promise<Response<{ exists: boolean }>> => {
  try {
    const parsedSlug = validateField(WorkspaceCreateSchema.shape.slug, slug, 'slug');

    if (!parsedSlug.success) {
      return parsedSlug.response;
    }

    // This route is public, so there is no `app.user_id` and RLS hides every
    // workspace from it - a plain lookup would always report "available".
    // `app_slug_exists` is a SECURITY DEFINER function that answers the availability
    // question with a boolean, without exposing any row.
    const result = await getDb().execute(sql`SELECT app_slug_exists(${parsedSlug.data}) AS exists`);

    return {
      status: 200,
      body: { exists: Boolean(result.rows[0]?.exists) },
    };
  } catch (error) {
    logger.error(error);

    return errorResponse(BASE_ERRORS, 'INTERNAL_ERROR');
  }
};

/**
 * Creates a workspace from a validated payload.
 *
 * Rejects reserved, protected, or banned slugs, then fails fast on a duplicate
 * slug before inserting. The pre-check is best-effort - the unique index on
 * `slug` is the real guard, so a concurrent collision surfacing as a unique
 * violation is also mapped to `WORKSPACE_SLUG_ALREADY_EXISTS`.
 *
 * @param userId - The id of the creating user; recorded as the workspace owner.
 * @param payload - The workspace fields to create; validated against `WorkspaceCreateSchema`.
 * @returns The created `Workspace` (201) on success, or an error response.
 */
export const workspaceCreate = async (
  userId: string,
  payload: WorkspaceCreate
): Promise<Response<Workspace>> => {
  try {
    const parsedPayload = validateRequestBody<WorkspaceCreate>(WorkspaceCreateSchema, payload);

    if (!parsedPayload.success) {
      return parsedPayload.response;
    }

    const { data } = parsedPayload;

    const slugError = await checkSlugAvailability(data.slug);

    if (slugError) {
      return slugError;
    }

    // Resolve the plan the new workspace starts on: the current active free plan.
    // Missing means the plan catalog wasn't seeded - a server misconfiguration,
    // so fail before opening the transaction rather than creating a workspace
    // with no subscription.
    const freePlan = await findActivePlan('free');

    if (!freePlan) {
      logger.error('No active plan found for the "free" tier - is the plan catalog seeded?');

      return errorResponse(WORKSPACE_ERRORS, 'WORKSPACE_CREATE_FAILED');
    }

    // Create the new workspace with all the relations. Any thrown error rolls
    // back the whole transaction and lands in the catch below - so the guards
    // below `throw` (never `return`) to actually abort a partial write.
    const workspaceId = await getDb().transaction(async (tx) => {
      // No `.returning()` here, on purpose: `INSERT ... RETURNING` also applies the
      // SELECT policy, and this workspace is not visible to us yet - RLS only reveals
      // workspaces we are a member of, and the owner row below does not exist yet. So
      // we generate the id up front instead of reading it back. The insert still throws
      // if the INSERT policy rejects it, so nothing fails silently.
      const id = randomUUID();

      await tx.insert(schema.workspace).values({
        id,
        name: data.name,
        slug: data.slug,
        description: data.description,
        logo: data.logo,
        type: data.type,
        industry: data.industry,
        billingEmail: data.billingEmail,
      });

      // Add the workspace owner. This MUST come before any other row that hangs
      // off the workspace: the RLS policies on those tables gate on
      // `app_is_member(workspace_id)`, and the caller only becomes a member once
      // this row exists. Later statements in this transaction see it (a
      // transaction sees its own uncommitted writes), so the inserts below pass.
      const [workspaceMember] = await tx
        .insert(schema.workspaceMember)
        .values({
          userId,
          workspaceId: id,
          role: 'owner',
          status: 'active',
        })
        .returning();

      if (!workspaceMember) {
        throw new Error('Failed to create workspace member');
      }

      // Subscribe the workspace to the free plan. Must come after the owner
      // member row above: the `workspace_subscription` RLS INSERT policy gates on
      // `app_is_member(workspace_id)`, which is only true once that row exists.
      await tx.insert(schema.workspaceSubscription).values({
        workspaceId: id,
        planId: freePlan.id,
        status: 'active',
      });

      const [workspaceLocation] = await tx
        .insert(schema.workspaceLocation)
        .values({
          workspaceId: id,
          name: 'Default',
          isDefault: true,
        })
        .returning();

      if (!workspaceLocation) {
        throw new Error('Failed to create workspace location');
      }

      await tx.insert(schema.workspaceMemberLocation).values({
        memberId: workspaceMember.id,
        locationId: workspaceLocation.id,
      });

      return id;
    });

    // Re-read as the owner (the creator) so the response includes all role-scoped
    // relations, matching the shape of every other workspace read. By now the owner
    // membership exists, so RLS reveals the workspace to us.
    const created = await findWorkspace('owner', eq(schema.workspace.id, workspaceId));

    if (!created) {
      return errorResponse(WORKSPACE_ERRORS, 'WORKSPACE_CREATE_FAILED');
    }

    return { status: 201, body: toWorkspaceResponse(created) };
  } catch (error) {
    // A concurrent insert can slip past the pre-check; the unique index is the real guard.
    if (isUniqueViolation(error)) {
      return errorResponse(WORKSPACE_ERRORS, 'WORKSPACE_SLUG_ALREADY_EXISTS');
    }

    logger.error(error);

    return errorResponse(BASE_ERRORS, 'INTERNAL_ERROR');
  }
};

/**
 * Lists the workspaces the calling user belongs to, as minimal summaries (no
 * relations) for a workspace switcher / "my workspaces" list.
 *
 * User-scoped, not workspace-scoped: its route is gated on authentication only
 * (no `requireWorkspaceAccess`), and the listing is filtered to the caller's own
 * active memberships. A user with no workspaces gets an empty array.
 *
 * @param userId - The calling user's id; scopes the listing to their memberships.
 * @returns The user's workspaces as summaries (200), or an error response.
 */
export const workspaceGetAll = async (userId: string): Promise<Response<WorkspaceSummary[]>> => {
  try {
    const workspaces = await findUserWorkspaces(userId);

    return { status: 200, body: workspaces };
  } catch (error) {
    logger.error(error);

    return errorResponse(BASE_ERRORS, 'INTERNAL_ERROR');
  }
};

/**
 * Fetches a workspace by its id.
 *
 * @param member - The caller's workspace membership; its role scopes which relations load.
 * @param id - The workspace id; must be a valid UUID or `INVALID_INPUT` is returned.
 * @returns The `Workspace` (200), `WORKSPACE_NOT_FOUND` (404), or an error response.
 */
export const workspaceGetById = async (
  member: WorkspaceMemberContext,
  id: unknown
): Promise<Response<Workspace>> => {
  try {
    const parsedId = validateField(z.uuid(), id, 'id');

    if (!parsedId.success) {
      return parsedId.response;
    }

    return respondWithWorkspace(member.role, eq(schema.workspace.id, parsedId.data));
  } catch (error) {
    logger.error(error);

    return errorResponse(BASE_ERRORS, 'INTERNAL_ERROR');
  }
};

/**
 * Fetches a workspace by its public slug.
 *
 * The slug is normalized with the same transform `workspaceCreate` uses, so a
 * lookup matches however the value was originally stored.
 *
 * @param member - The caller's workspace membership; its role scopes which relations load.
 * @param slug - The workspace slug; validated/normalized before lookup.
 * @returns The `Workspace` (200), `WORKSPACE_NOT_FOUND` (404), or an error response.
 */
export const workspaceGetBySlug = async (
  member: WorkspaceMemberContext,
  slug: unknown
): Promise<Response<Workspace>> => {
  try {
    const parsedSlug = validateField(WorkspaceCreateSchema.shape.slug, slug, 'slug');

    if (!parsedSlug.success) {
      return parsedSlug.response;
    }

    return respondWithWorkspace(member.role, eq(schema.workspace.slug, parsedSlug.data));
  } catch (error) {
    logger.error(error);

    return errorResponse(BASE_ERRORS, 'INTERNAL_ERROR');
  }
};

/**
 * Deletes a workspace by its id.
 *
 * @param id - The workspace id; must be a valid UUID or `INVALID_INPUT` is returned.
 * @returns `204 No Content` on success, `WORKSPACE_NOT_FOUND` (404), or an error response.
 */
export const workspaceDelete = async (id: unknown): Promise<NoContentResponse> => {
  try {
    const parsedId = validateField(z.uuid(), id, 'id');

    if (!parsedId.success) {
      return parsedId.response;
    }

    const [result] = await getDb()
      .delete(schema.workspace)
      .where(eq(schema.workspace.id, parsedId.data))
      .returning();

    if (!result) {
      return errorResponse(WORKSPACE_ERRORS, 'WORKSPACE_NOT_FOUND');
    }

    return { status: 204, body: null };
  } catch (error) {
    logger.error(error);

    return errorResponse(BASE_ERRORS, 'INTERNAL_ERROR');
  }
};

/**
 * Updates a workspace by its id, applying only the provided fields.
 *
 * When a new slug is supplied, rejects reserved, protected, or banned slugs and
 * fails fast on a duplicate held by another workspace. The pre-check is
 * best-effort - the unique index on `slug` is the real guard, so a concurrent
 * collision surfacing as a unique violation is also mapped to
 * `WORKSPACE_SLUG_ALREADY_EXISTS`. An empty payload is a no-op that returns the current
 * workspace unchanged.
 *
 * @param member - The caller's workspace membership; identifies the workspace and scopes relations.
 * @param payload - The workspace fields to update; validated against `WorkspaceUpdateSchema`.
 * @returns The updated `Workspace` (200) on success, `WORKSPACE_NOT_FOUND` (404) if no row matches, or an error response.
 */
export const workspaceUpdate = async (
  member: WorkspaceMemberContext,
  payload: WorkspaceUpdate
): Promise<Response<Workspace>> => {
  try {
    const parsedId = validateField(z.uuid(), member.workspaceId, 'id');

    if (!parsedId.success) {
      return parsedId.response;
    }

    const parsedPayload = validateRequestBody<WorkspaceUpdate>(WorkspaceUpdateSchema, payload);

    if (!parsedPayload.success) {
      return parsedPayload.response;
    }

    const { data } = parsedPayload;

    // Empty payload: return the workspace unchanged rather than let Drizzle throw on `.set({})`.
    if (Object.keys(data).length === 0) {
      return respondWithWorkspace(member.role, eq(schema.workspace.id, parsedId.data));
    }

    if (data.slug) {
      const slugError = await checkSlugAvailability(data.slug, parsedId.data);

      if (slugError) {
        return slugError;
      }
    }

    const [workspace] = await getDb()
      .update(schema.workspace)
      .set({
        ...data,
      })
      .where(eq(schema.workspace.id, parsedId.data))
      .returning();

    // A valid id that matches no row means the workspace doesn't exist - the
    // `.set()` above always returns the row when the id matches.
    if (!workspace) {
      return errorResponse(WORKSPACE_ERRORS, 'WORKSPACE_NOT_FOUND');
    }

    // Re-read through the shared path so the response matches every other
    // workspace read (same role-scoped relations), not the bare updated row.
    return respondWithWorkspace(member.role, eq(schema.workspace.id, parsedId.data));
  } catch (error) {
    // A concurrent update can slip past the pre-check; the unique index is the real guard.
    if (isUniqueViolation(error)) {
      return errorResponse(WORKSPACE_ERRORS, 'WORKSPACE_SLUG_ALREADY_EXISTS');
    }

    logger.error(error);

    return errorResponse(BASE_ERRORS, 'INTERNAL_ERROR');
  }
};
