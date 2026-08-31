import { getDb } from '#/config/db-context.ts';
import { logger } from '#/config/logger.ts';
import { getRequestLocale } from '#/config/request-context.ts';
import { urls } from '#/config/urls.ts';
import type { MemberContext, SessionUser, WorkspaceContext } from '#/types/context.ts';
import { audienceSegmentsForSelf } from '#/utils/audience.ts';
import { isUniqueViolation } from '#/utils/db-error.ts';
import { pushToOutbox } from '#/utils/outbox.ts';
import { validateField, validateRequestBody } from '#/utils/validation.ts';
import { and, eq, sql } from 'drizzle-orm';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';

import { INVITE_TTL_MS } from '@ordre/core/constants';
import {
  BASE_ERRORS,
  errorResponse,
  INVITE_ERRORS,
  LOCATION_ERRORS,
  MEMBER_ERRORS,
} from '@ordre/core/errors';
import { WorkspaceInviteCreateSchema } from '@ordre/core/schemas';
import type {
  NoContentResponse,
  Response,
  WorkspaceInvite,
  WorkspaceInviteCreate,
  WorkspaceInvitePreview,
} from '@ordre/core/types';
import * as schema from '@ordre/db/schemas';

import {
  expireStalePendingInvite,
  findInvite,
  findInvites,
  hasActiveMemberWithEmail,
  hasPendingInvite,
  type InvitePreviewRow,
  toInvitePreviewResponse,
  toInviteResponse,
} from './invite.utils.ts';
import { locationInWorkspace } from './location.utils.ts';

/**
 * Creates a pending invite for someone to join the caller's workspace.
 *
 * The invite is always scoped to the caller's own workspace, so the
 * `workspaceId` is taken from the workspace context rather than the payload. An
 * invite is rejected when the email already belongs to an active member or an
 * unexpired pending invite; a stale (past-`expiresAt`) pending invite is expired
 * first so the email can be re-invited. When supplied, the target location must
 * live in the same workspace. The generated `token` and `expiresAt`
 * (now + `INVITE_TTL_MS`) back the eventual accept flow.
 *
 * @param workspace - The workspace the request is scoped to; owns the new invite.
 * @param member - The caller's workspace membership; recorded as the inviter.
 * @param payload - The invite fields to create; validated against `WorkspaceInviteCreateSchema`.
 * @returns The created `WorkspaceInvite` (201), `MEMBER_ALREADY_EXISTS` /
 *   `INVITE_ALREADY_PENDING` (409), `LOCATION_NOT_FOUND` (404), or an error response.
 */
export const workspaceInviteCreate = async (
  workspace: WorkspaceContext,
  user: SessionUser,
  member: MemberContext,
  payload: WorkspaceInviteCreate
): Promise<Response<WorkspaceInvite>> => {
  try {
    const parsedPayload = validateRequestBody<WorkspaceInviteCreate>(
      WorkspaceInviteCreateSchema,
      payload
    );

    if (!parsedPayload.success) {
      return parsedPayload.response;
    }

    // Expire a stale pending invite for this email before the checks below.
    await expireStalePendingInvite(workspace.id, parsedPayload.data.email);

    const hasActiveMember = await hasActiveMemberWithEmail(workspace.id, parsedPayload.data.email);
    if (hasActiveMember) {
      return errorResponse(MEMBER_ERRORS, 'MEMBER_ALREADY_EXISTS');
    }

    const hasPending = await hasPendingInvite(workspace.id, parsedPayload.data.email);
    if (hasPending) {
      return errorResponse(INVITE_ERRORS, 'INVITE_ALREADY_PENDING');
    }

    // Check if the Location received exists in the workspace
    if (
      parsedPayload.data.locationId &&
      !(await locationInWorkspace(workspace.id, parsedPayload.data.locationId))
    ) {
      return errorResponse(LOCATION_ERRORS, 'LOCATION_NOT_FOUND');
    }

    const now = new Date();

    const invite = await getDb().transaction(async (tx) => {
      const [inviteData] = await tx
        .insert(schema.workspaceInvite)
        .values({
          invitedByMemberId: member.id,
          workspaceId: workspace.id,
          email: parsedPayload.data.email,
          name: parsedPayload.data.name,
          role: parsedPayload.data.role,
          status: 'pending',
          locationId: parsedPayload.data.locationId,
          token: randomBytes(32).toString('base64url'),
          expiresAt: new Date(now.getTime() + INVITE_TTL_MS),
        })
        .returning();

      if (!inviteData) {
        return null;
      }

      await pushToOutbox(tx, {
        channel: 'email',
        topic: 'invite:created',
        to: parsedPayload.data.email,
        locale: member.locale,
        variables: {
          workspace_name: workspace.name,
          inviter_name: user.firstName,
          invitee_email: parsedPayload.data.email,
          invited_role: parsedPayload.data.role,
          invite_url: urls.invite(inviteData.token),
        },
      });

      return inviteData;
    });

    if (!invite) {
      return errorResponse(INVITE_ERRORS, 'INVITE_CREATE_FAILED');
    }

    return { status: 201, body: toInviteResponse(invite) };
  } catch (error) {
    // A concurrent invite can slip past the pending-invite pre-check; the partial
    // unique index is the real guard, so map its violation to the same 409.
    if (isUniqueViolation(error, 'workspace_invite_workspace_email_pending_unique')) {
      return errorResponse(INVITE_ERRORS, 'INVITE_ALREADY_PENDING');
    }

    logger.error(error);

    return errorResponse(BASE_ERRORS, 'INTERNAL_ERROR');
  }
};

/**
 * Deletes a pending invite belonging to the caller's workspace.
 *
 * This is a soft delete: the row is retained and its `status` is set to
 * `revoked` (so it stays in the workspace's invite history), rather than being
 * removed from the table. From the caller's perspective the invite is gone -
 * it no longer grants access and can't be accepted - which is why the endpoint
 * is modelled as a DELETE returning `204 No Content`.
 *
 * Only a `pending` invite can be deleted, and only within the caller's own
 * workspace: the update is scoped to the workspace context (on top of RLS) and to
 * `status = 'pending'`, so an accepted/declined/expired/already-revoked invite is
 * left untouched. A missing invite, one in another workspace, and one in a
 * non-pending state all collapse to the same `INVITE_NOT_FOUND` - the endpoint
 * never reveals whether an invite exists outside the caller's workspace.
 *
 * @param workspace - The workspace the request is scoped to; scopes the delete.
 * @param inviteId - The invite id to delete; validated as a UUID.
 * @returns `204 No Content` on success, `INVITE_NOT_FOUND` (404), or an error response.
 */
export const workspaceInviteDelete = async (
  workspace: WorkspaceContext,
  inviteId: unknown
): Promise<NoContentResponse> => {
  try {
    const parsedInviteId = validateField(z.uuid(), inviteId, 'inviteId');

    if (!parsedInviteId.success) {
      return parsedInviteId.response;
    }

    // Soft delete: retain the row as history by flipping its status to `revoked`
    // rather than deleting it.
    const [revoked] = await getDb()
      .update(schema.workspaceInvite)
      .set({ status: 'revoked' })
      .where(
        and(
          eq(schema.workspaceInvite.id, parsedInviteId.data),
          eq(schema.workspaceInvite.workspaceId, workspace.id),
          eq(schema.workspaceInvite.status, 'pending')
        )
      )
      .returning();

    if (!revoked) {
      return errorResponse(INVITE_ERRORS, 'INVITE_NOT_FOUND');
    }

    return { status: 204, body: null };
  } catch (error) {
    logger.error(error);

    return errorResponse(BASE_ERRORS, 'INTERNAL_ERROR');
  }
};

/**
 * Fetches a single invite in the caller's workspace by its id.
 *
 * Scoped to the caller's workspace (regardless of status, to mirror
 * {@link workspaceInviteGetAll}), so an invite in another workspace and a missing
 * one both collapse to the same `INVITE_NOT_FOUND` - the endpoint never reveals
 * whether an invite exists outside the caller's workspace.
 *
 * @param workspace - The workspace the request is scoped to; scopes the lookup.
 * @param inviteId - The invite id; must be a valid UUID or `INVALID_INPUT` is returned.
 * @returns The `WorkspaceInvite` (200), `INVITE_NOT_FOUND` (404), or an error response.
 */
export const workspaceInviteGetById = async (
  workspace: WorkspaceContext,
  inviteId: unknown
): Promise<Response<WorkspaceInvite>> => {
  try {
    const parsedInviteId = validateField(z.uuid(), inviteId, 'inviteId');

    if (!parsedInviteId.success) {
      return parsedInviteId.response;
    }

    const invite = await findInvite(workspace.id, parsedInviteId.data);

    if (!invite) {
      return errorResponse(INVITE_ERRORS, 'INVITE_NOT_FOUND');
    }

    return {
      status: 200,
      body: toInviteResponse(invite),
    };
  } catch (error) {
    logger.error(error);

    return errorResponse(BASE_ERRORS, 'INTERNAL_ERROR');
  }
};

/**
 * Lists every invite in the caller's workspace (newest first), regardless of status.
 *
 * Unlike {@link workspaceInviteGetById}, the listing is not filtered to pending
 * invites, so accepted/declined/expired/revoked invites are included as history.
 *
 * @param workspace - The workspace the request is scoped to; scopes the listing.
 * @returns The workspace's invites (200), or an error response.
 */
export const workspaceInviteGetAll = async (
  workspace: WorkspaceContext
): Promise<Response<WorkspaceInvite[]>> => {
  try {
    const invites = await findInvites(workspace.id);

    return {
      status: 200,
      body: invites.map(toInviteResponse),
    };
  } catch (error) {
    logger.error(error);

    return errorResponse(BASE_ERRORS, 'INTERNAL_ERROR');
  }
};

/**
 * Fetches the public, unauthenticated preview of an invite by its token.
 *
 * This backs the invite landing page, which renders before the invitee has an
 * account or a session - so it deliberately takes no member/user context. The
 * lookup goes through the `app_invite_preview` SECURITY DEFINER function (see
 * migration 0005) because RLS would otherwise hide the invite from a caller who
 * isn't a workspace member. The function only returns a pending, non-expired
 * invite and exposes a minimal projection (never the token or internal ids), so
 * a missing/expired/consumed invite all collapse to `INVITE_NOT_FOUND`.
 *
 * @param token - The invite token from the URL; validated as a non-empty string.
 * @returns The `WorkspaceInvitePreview` (200), `INVITE_NOT_FOUND` (404), or an error response.
 */
export const workspaceInvitePreviewByToken = async (
  token: unknown
): Promise<Response<WorkspaceInvitePreview>> => {
  try {
    const parsedToken = validateField(z.string(), token, 'token');

    if (!parsedToken.success) {
      return parsedToken.response;
    }

    const result = await getDb().execute<InvitePreviewRow>(
      sql`SELECT * FROM app_invite_preview(${parsedToken.data})`
    );

    const invite = result.rows[0];

    if (!invite) {
      return errorResponse(INVITE_ERRORS, 'INVITE_NOT_FOUND');
    }

    return {
      status: 200,
      body: toInvitePreviewResponse(invite),
    };
  } catch (error) {
    logger.error(error);

    return errorResponse(BASE_ERRORS, 'INTERNAL_ERROR');
  }
};

/**
 * Accepts an invite on behalf of the currently authenticated user.
 *
 * The heavy lifting happens in the `app_invite_accept` SECURITY DEFINER function
 * (see migration 0005), which runs atomically: it re-reads the caller from
 * `app_current_user_id()` (set by `rlsContext`) rather than trusting the client,
 * verifies the invite is pending/unexpired and that the caller's email matches the
 * invite's email, then creates the membership (and its location link, if any) and
 * marks the invite `accepted`. This controller only maps the function's status
 * string onto a `Response`.
 *
 * Accepting is idempotent: an invite the caller has already accepted returns
 * `204` as well, so a double submit or retried request is harmless.
 *
 * @param token - The invite token from the URL; validated as a non-empty string.
 *   The caller's identity is taken from the session (via RLS), not from arguments.
 * @returns `204 No Content` on `ACCEPTED`/`ALREADY_MEMBER`,
 *   `INVITE_EMAIL_MISMATCH` (403), `UNAUTHORIZED` (401), `INVITE_NOT_FOUND` (404),
 *   or an error response.
 */
export const workspaceInviteAccept = async (
  token: unknown,
  user: SessionUser
): Promise<NoContentResponse> => {
  try {
    const parsedToken = validateField(z.string(), token, 'token');

    if (!parsedToken.success) {
      return parsedToken.response;
    }

    // The locale is passed in because the function creates the membership row and
    // has no request to negotiate from. It only lands on a first-time join.
    const result = await getDb().execute<{ app_invite_accept: string }>(
      sql`SELECT app_invite_accept(${parsedToken.data}, ${getRequestLocale()})`
    );

    const status = result.rows[0]?.app_invite_accept;

    if (status === 'INVITE_EMAIL_MISMATCH') {
      return errorResponse(INVITE_ERRORS, 'INVITE_EMAIL_MISMATCH');
    }

    if (status === 'UNAUTHORIZED') {
      return errorResponse(BASE_ERRORS, 'UNAUTHORIZED');
    }

    if (status === 'ACCEPTED') {
      await pushToOutbox(getDb(), {
        channel: 'audience',
        topic: 'contact:sync',
        to: user.email,
        variables: {
          contact_first_name: user.firstName,
          contact_last_name: user.lastName,
          // `getDb()` is the request transaction the accept function ran in, so the
          // membership it created is visible and the row commits with it.
          contact_segments: await audienceSegmentsForSelf(getDb(), user.id),
          contact_topics: [],
        },
      });
    }

    // Idempotent: re-accepting an already-joined invite is a success.
    if (status === 'ACCEPTED' || status === 'ALREADY_MEMBER') {
      return { status: 204, body: null };
    }

    return errorResponse(INVITE_ERRORS, 'INVITE_NOT_FOUND');
  } catch (error) {
    logger.error(error);
    return errorResponse(BASE_ERRORS, 'INTERNAL_ERROR');
  }
};

/**
 * Declines an invite by its token (the invitee's "no").
 *
 * Public and token-only, like preview: no account or session is required to
 * decline, so the token itself is the authorization and there is no email check.
 * The `app_invite_decline` SECURITY DEFINER function (see migration 0005) flips a
 * pending invite to `declined` and returns its id; a token matching no pending
 * invite returns no id and collapses to `INVITE_NOT_FOUND`.
 *
 * @param token - The invite token from the URL; validated as a non-empty string.
 * @returns `204 No Content` on success, `INVITE_NOT_FOUND` (404), or an error response.
 */
export const workspaceInviteDecline = async (token: unknown): Promise<NoContentResponse> => {
  try {
    const parsedToken = validateField(z.string(), token, 'token');

    if (!parsedToken.success) {
      return parsedToken.response;
    }

    const result = await getDb().execute<{ app_invite_decline: string | null }>(
      sql`SELECT app_invite_decline(${parsedToken.data})`
    );

    if (!result.rows[0]?.app_invite_decline) {
      return errorResponse(INVITE_ERRORS, 'INVITE_NOT_FOUND');
    }

    return { status: 204, body: null };
  } catch (error) {
    logger.error(error);

    return errorResponse(BASE_ERRORS, 'INTERNAL_ERROR');
  }
};
