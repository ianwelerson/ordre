import { getDb } from '#/config/db-context.ts';
import { logger } from '#/config/logger.ts';
import type { WorkspaceContext } from '#/types/context.ts';
import { isUniqueViolation } from '#/utils/db-error.ts';
import { validateField, validateRequestBody } from '#/utils/validation.ts';
import { and, eq, inArray } from 'drizzle-orm';
import z from 'zod';

import { BASE_ERRORS, errorResponse, LOCATION_ERRORS, MEMBER_ERRORS } from '@ordre/core/errors';
import {
  WorkspaceLocationCreateSchema,
  WorkspaceLocationMemberRemoveSchema,
  WorkspaceLocationUpdateSchema,
} from '@ordre/core/schemas';
import type {
  NoContentResponse,
  Response,
  WorkspaceLocation,
  WorkspaceLocationCreate,
  WorkspaceLocationMemberRemove,
  WorkspaceLocationUpdate,
} from '@ordre/core/types';
import * as schema from '@ordre/db/schemas';

import {
  assignMemberToLocation,
  createLocation,
  findDefaultLocation,
  findLocation,
  findLocations,
  toLocationResponse,
  unassignMemberFromLocation,
  updateLocation,
} from './location.utils.ts';
import { findMember } from './member.utils.ts';

/**
 * Creates a location in the caller's workspace.
 *
 * The location is always attached to the caller's own workspace, so the
 * `workspaceId` is taken from the workspace context rather than the payload.
 *
 * @param workspace - The workspace the request is scoped to; owns the new location.
 * @param payload - The location fields to create; validated against `WorkspaceLocationCreateSchema`.
 * @returns The created `WorkspaceLocation` (201) on success, or an error response.
 */
export const workspaceLocationCreate = async (
  workspace: WorkspaceContext,
  payload: WorkspaceLocationCreate
): Promise<Response<WorkspaceLocation>> => {
  try {
    const parsedPayload = validateRequestBody<WorkspaceLocationCreate>(
      WorkspaceLocationCreateSchema,
      payload
    );

    if (!parsedPayload.success) {
      return parsedPayload.response;
    }

    const { data } = parsedPayload;

    const newLocation = await createLocation(workspace.id, data);

    if (!newLocation) {
      return errorResponse(LOCATION_ERRORS, 'LOCATION_CREATE_FAILED');
    }

    return { status: 201, body: toLocationResponse(newLocation) };
  } catch (error) {
    logger.error(error);

    return errorResponse(BASE_ERRORS, 'INTERNAL_ERROR');
  }
};

/**
 * Lists every location in the caller's workspace (default first, then newest).
 *
 * @param workspace - The workspace the request is scoped to; scopes the listing.
 * @returns The workspace's locations (200), or an error response.
 */
export const workspaceLocationGetAll = async (
  workspace: WorkspaceContext
): Promise<Response<WorkspaceLocation[]>> => {
  try {
    const locations = await findLocations(workspace.id);

    return { status: 200, body: locations.map(toLocationResponse) };
  } catch (error) {
    logger.error(error);

    return errorResponse(BASE_ERRORS, 'INTERNAL_ERROR');
  }
};

/**
 * Fetches a single location in the caller's workspace by its id.
 *
 * Scoped to the caller's workspace, so a location that belongs to another
 * workspace reads as `LOCATION_NOT_FOUND` rather than being exposed.
 *
 * @param workspace - The workspace the request is scoped to; scopes the lookup.
 * @param locationId - The location id; must be a valid UUID or `INVALID_INPUT` is returned.
 * @returns The `WorkspaceLocation` (200), `LOCATION_NOT_FOUND` (404), or an error response.
 */
export const workspaceLocationGetById = async (
  workspace: WorkspaceContext,
  locationId: unknown
): Promise<Response<WorkspaceLocation>> => {
  try {
    const parsedLocationId = validateField(z.uuid(), locationId, 'locationId');

    if (!parsedLocationId.success) {
      return parsedLocationId.response;
    }

    const location = await findLocation(workspace.id, parsedLocationId.data);

    if (!location) {
      return errorResponse(LOCATION_ERRORS, 'LOCATION_NOT_FOUND');
    }

    return { status: 200, body: toLocationResponse(location) };
  } catch (error) {
    logger.error(error);

    return errorResponse(BASE_ERRORS, 'INTERNAL_ERROR');
  }
};

/**
 * Updates a location in the caller's workspace, applying only the provided fields.
 *
 * Scoped to the caller's workspace, so a location that belongs to another
 * workspace reads as `LOCATION_NOT_FOUND` and can never be moved between
 * workspaces. An empty payload is a no-op that returns the current location
 * unchanged (rather than letting Drizzle throw on an empty `.set({})`).
 *
 * @param workspace - The workspace the request is scoped to; scopes the update.
 * @param locationId - The location id; must be a valid UUID or `INVALID_INPUT` is returned.
 * @param payload - The fields to update; validated against `WorkspaceLocationUpdateSchema`.
 * @returns The updated `WorkspaceLocation` (200), `LOCATION_NOT_FOUND` (404), or an error response.
 */
export const workspaceLocationUpdate = async (
  workspace: WorkspaceContext,
  locationId: unknown,
  payload: WorkspaceLocationUpdate
): Promise<Response<WorkspaceLocation>> => {
  try {
    const parsedPayload = validateRequestBody<WorkspaceLocationUpdate>(
      WorkspaceLocationUpdateSchema,
      payload
    );

    if (!parsedPayload.success) {
      return parsedPayload.response;
    }

    const parsedLocationId = validateField(z.uuid(), locationId, 'locationId');

    if (!parsedLocationId.success) {
      return parsedLocationId.response;
    }

    const { data } = parsedPayload;

    // Empty payload: return the location unchanged rather than let Drizzle throw on `.set({})`.
    if (Object.keys(data).length === 0) {
      const current = await findLocation(workspace.id, parsedLocationId.data);

      if (!current) {
        return errorResponse(LOCATION_ERRORS, 'LOCATION_NOT_FOUND');
      }

      return { status: 200, body: toLocationResponse(current) };
    }

    const updated = await updateLocation(workspace.id, parsedLocationId.data, data);

    if (!updated) {
      return errorResponse(LOCATION_ERRORS, 'LOCATION_NOT_FOUND');
    }

    return { status: 200, body: toLocationResponse(updated) };
  } catch (error) {
    logger.error(error);

    return errorResponse(BASE_ERRORS, 'INTERNAL_ERROR');
  }
};

/**
 * Promotes a location to be its workspace's default.
 *
 * A workspace has exactly one default (enforced by a partial unique index), so
 * this is a two-row swap: demote the current default, then promote the target.
 * Both run in one transaction, demote first, so the unique index is never
 * momentarily violated. If the target isn't in the workspace, the promote
 * matches no row and the whole swap rolls back - the workspace keeps its
 * existing default.
 *
 * @param workspace - The workspace the request is scoped to; scopes the swap.
 * @param locationId - The id of the location to promote; must be a valid UUID.
 * @returns The promoted `WorkspaceLocation` (200), `LOCATION_NOT_FOUND` (404), or an error response.
 */
export const workspaceLocationSetDefault = async (
  workspace: WorkspaceContext,
  locationId: unknown
): Promise<Response<WorkspaceLocation>> => {
  try {
    const parsedLocationId = validateField(z.uuid(), locationId, 'locationId');

    if (!parsedLocationId.success) {
      return parsedLocationId.response;
    }

    const promoted = await getDb().transaction(async (tx) => {
      // Demote the current default first (no-op if the target already is it),
      // so the `is_default = true` partial unique index never sees two rows.
      await tx
        .update(schema.workspaceLocation)
        .set({ isDefault: false })
        .where(
          and(
            eq(schema.workspaceLocation.workspaceId, workspace.id),
            eq(schema.workspaceLocation.isDefault, true)
          )
        );

      // Promote the target, scoped to the workspace so another workspace's
      // location can't be targeted.
      const [location] = await tx
        .update(schema.workspaceLocation)
        .set({ isDefault: true })
        .where(
          and(
            eq(schema.workspaceLocation.workspaceId, workspace.id),
            eq(schema.workspaceLocation.id, parsedLocationId.data)
          )
        )
        .returning();

      return location;
    });

    if (!promoted) {
      return errorResponse(LOCATION_ERRORS, 'LOCATION_NOT_FOUND');
    }

    return { status: 200, body: toLocationResponse(promoted) };
  } catch (error) {
    logger.error(error);

    return errorResponse(BASE_ERRORS, 'INTERNAL_ERROR');
  }
};

/**
 * Deletes a non-default location from the caller's workspace.
 *
 * Everything tied to the location (member assignments, invites) is first
 * reassigned to the workspace's default location, so nothing is cascade-deleted
 * along with it. The default location itself can't be deleted - a workspace must
 * always keep one.
 *
 * @param workspace - The workspace the request is scoped to; scopes the delete.
 * @param locationId - The location id; must be a valid UUID or `INVALID_INPUT` is returned.
 * @returns `204 No Content` on success, `LOCATION_IS_DEFAULT` (409),
 *   `LOCATION_NOT_FOUND` (404), or an error response.
 */
export const workspaceLocationDelete = async (
  workspace: WorkspaceContext,
  locationId: unknown
): Promise<NoContentResponse> => {
  try {
    const parsedLocationId = validateField(z.uuid(), locationId, 'locationId');

    if (!parsedLocationId.success) {
      return parsedLocationId.response;
    }

    /**
     * We reassign everything tied to the deleted location to the workspace's
     * default location, so we need that default to exist - and we can never
     * delete the default itself. Checked up front: the guard depends on none of
     * the mutations below, and the request already runs inside a transaction
     * (RLS context), so this read is consistent with the writes that follow.
     */
    const defaultLocation = await findDefaultLocation(workspace.id);

    if (!defaultLocation) {
      return errorResponse(LOCATION_ERRORS, 'LOCATION_NOT_FOUND');
    }

    if (defaultLocation.id === parsedLocationId.data) {
      return errorResponse(LOCATION_ERRORS, 'LOCATION_IS_DEFAULT');
    }

    const [result] = await getDb().transaction(async (tx) => {
      /**
       * Members already assigned to the default location would collide with the
       * unique (member, location) constraint once we reassign, so drop their
       * rows on the location being deleted before moving the rest over.
       */
      const membersOnDefault = tx
        .select({ id: schema.workspaceMemberLocation.memberId })
        .from(schema.workspaceMemberLocation)
        .where(eq(schema.workspaceMemberLocation.locationId, defaultLocation.id));

      await tx
        .delete(schema.workspaceMemberLocation)
        .where(
          and(
            eq(schema.workspaceMemberLocation.locationId, parsedLocationId.data),
            inArray(schema.workspaceMemberLocation.memberId, membersOnDefault)
          )
        );

      await tx
        .update(schema.workspaceMemberLocation)
        .set({
          locationId: defaultLocation.id,
        })
        .where(eq(schema.workspaceMemberLocation.locationId, parsedLocationId.data));

      await tx
        .update(schema.workspaceInvite)
        .set({
          locationId: defaultLocation.id,
        })
        .where(eq(schema.workspaceInvite.locationId, parsedLocationId.data));

      return await tx
        .delete(schema.workspaceLocation)
        .where(
          and(
            eq(schema.workspaceLocation.workspaceId, workspace.id),
            eq(schema.workspaceLocation.id, parsedLocationId.data)
          )
        )
        .returning();
    });

    if (!result) {
      return errorResponse(LOCATION_ERRORS, 'LOCATION_NOT_FOUND');
    }

    return { status: 204, body: null };
  } catch (error) {
    logger.error(error);

    return errorResponse(BASE_ERRORS, 'INTERNAL_ERROR');
  }
};

/**
 * Assigns a member to a location, granting them access to it. Both the location
 * and the member must live in the caller's workspace (verified up front so a
 * foreign id reads as not-found rather than being silently linked).
 *
 * Modeled as an idempotent `PUT` on the membership URL: re-assigning a member who
 * is already on the location is a success, not a conflict - the unique
 * `(member, location)` constraint collision is caught and mapped to `204`.
 *
 * @param workspace - The workspace the request is scoped to; scopes both lookups.
 * @param locationId - The target location id; must be a valid UUID.
 * @param memberId - The member to assign; must be a valid UUID.
 * @returns `204 No Content` on success (or already-assigned), `LOCATION_NOT_FOUND` /
 *   `MEMBER_NOT_FOUND` (404), or an error response.
 */
export const workspaceLocationMemberAssign = async (
  workspace: WorkspaceContext,
  locationId: unknown,
  memberId: unknown
): Promise<NoContentResponse> => {
  try {
    const parsedLocationId = validateField(z.uuid(), locationId, 'locationId');

    if (!parsedLocationId.success) {
      return parsedLocationId.response;
    }

    const parsedMemberId = validateField(z.uuid(), memberId, 'memberId');

    if (!parsedMemberId.success) {
      return parsedMemberId.response;
    }

    const location = await findLocation(workspace.id, parsedLocationId.data);

    if (!location) {
      return errorResponse(LOCATION_ERRORS, 'LOCATION_NOT_FOUND');
    }

    // A suspended member is soft-removed, so treat them as not-found here rather
    // than granting a location - mirrors the `workspaceMemberLeave`/`update` guards.
    const target = await findMember(workspace.id, parsedMemberId.data);

    if (!target || target.status === 'suspended') {
      return errorResponse(MEMBER_ERRORS, 'MEMBER_NOT_FOUND');
    }

    const assigned = await assignMemberToLocation(parsedLocationId.data, parsedMemberId.data);

    if (!assigned) {
      return errorResponse(LOCATION_ERRORS, 'LOCATION_MEMBER_ASSIGN_FAILED');
    }

    return { status: 204, body: null };
  } catch (error) {
    // Already assigned to this location: a PUT is idempotent, so the unique
    // `(member, location)` collision is a success, not an error.
    if (isUniqueViolation(error, 'workspace_member_location_unique')) {
      return { status: 204, body: null };
    }

    logger.error(error);

    return errorResponse(BASE_ERRORS, 'INTERNAL_ERROR');
  }
};

/**
 * Removes a member's assignment to a location (revokes their access to it).
 *
 * Idempotent: unassigning a member who isn't on the location still returns `204`,
 * so a double submit or retried request is harmless. The delete is scoped to the
 * `(member, location)` pair; RLS keeps it within the caller's workspace, which is
 * why this takes neither a workspace nor a member context.
 *
 * @param locationId - The location id; must be a valid UUID.
 * @param memberId - The member to unassign; must be a valid UUID.
 * @param payload - Removal options; validated against `WorkspaceLocationMemberRemoveSchema`.
 * @returns `204 No Content` on success, `INVALID_INPUT` (400), or an error response.
 */
export const workspaceLocationMemberUnassign = async (
  locationId: unknown,
  memberId: unknown,
  payload: WorkspaceLocationMemberRemove
): Promise<NoContentResponse> => {
  try {
    const parsedLocationId = validateField(z.uuid(), locationId, 'locationId');

    if (!parsedLocationId.success) {
      return parsedLocationId.response;
    }

    const parsedMemberId = validateField(z.uuid(), memberId, 'memberId');

    if (!parsedMemberId.success) {
      return parsedMemberId.response;
    }

    // @TODO: `reassignToMemberId` is accepted but not wired yet - once implemented it
    // will move everything this member owns at this location to another member.
    // The whole body is optional, so a request with none normalizes to `{}`.
    const parsedPayload = validateRequestBody<WorkspaceLocationMemberRemove>(
      WorkspaceLocationMemberRemoveSchema,
      payload ?? {}
    );

    if (!parsedPayload.success) {
      return parsedPayload.response;
    }

    await unassignMemberFromLocation(parsedLocationId.data, parsedMemberId.data);

    return { status: 204, body: null };
  } catch (error) {
    logger.error(error);

    return errorResponse(BASE_ERRORS, 'INTERNAL_ERROR');
  }
};
