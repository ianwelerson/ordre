import { getDb } from '#/config/db-context.ts';
import { logger } from '#/config/logger.ts';
import type { MemberContext, SessionUser, WorkspaceContext } from '#/types/context.ts';
import { audienceSegmentsForSelf, audienceStateForMember } from '#/utils/audience.ts';
import { pushToOutbox } from '#/utils/outbox.ts';
import { validateField, validateRequestBody } from '#/utils/validation.ts';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

import { BASE_ERRORS, errorResponse, MEMBER_ERRORS } from '@ordre/core/errors';
import {
  WorkspaceMemberRemoveSchema,
  WorkspaceMemberRoleUpdateSchema,
  WorkspaceMemberUpdateSchema,
} from '@ordre/core/schemas';
import type {
  NoContentResponse,
  Response,
  WorkspaceMember,
  WorkspaceMemberRemove,
  WorkspaceMemberRoleUpdate,
  WorkspaceMemberUpdate,
} from '@ordre/core/types';
import * as schema from '@ordre/db/schemas';

import {
  countActiveOwnersForUpdate,
  findMember,
  findMembers,
  suspendMember,
  toMemberResponse,
  updateMember,
} from './member.utils.ts';

/**
 * Lists every member of the caller's workspace (all statuses), newest first.
 *
 * @param workspace - The workspace the request is scoped to; scopes the listing.
 * @returns The workspace's members (200), or an error response.
 */
export const workspaceMemberGetAll = async (
  workspace: WorkspaceContext
): Promise<Response<WorkspaceMember[]>> => {
  try {
    const members = await findMembers(workspace.id);

    return { status: 200, body: members.map(toMemberResponse) };
  } catch (error) {
    logger.error(error);

    return errorResponse(BASE_ERRORS, 'INTERNAL_ERROR');
  }
};

/**
 * Returns the caller's own membership in the workspace.
 *
 * Self-service, so its route is gated on workspace access only - no
 * `member:manage`. The member id comes from the caller's context, so there is no
 * id to validate.
 *
 * @param workspace - The workspace the request is scoped to; scopes the lookup.
 * @param member - The caller's workspace membership; identifies the row to load.
 * @returns The caller's `WorkspaceMember` (200), `MEMBER_NOT_FOUND` (404), or an error response.
 */
export const workspaceMemberGetSelf = async (
  workspace: WorkspaceContext,
  member: MemberContext
): Promise<Response<WorkspaceMember>> => {
  try {
    const self = await findMember(workspace.id, member.id);

    if (!self) {
      return errorResponse(MEMBER_ERRORS, 'MEMBER_NOT_FOUND');
    }

    return { status: 200, body: toMemberResponse(self) };
  } catch (error) {
    logger.error(error);

    return errorResponse(BASE_ERRORS, 'INTERNAL_ERROR');
  }
};

/**
 * Fetches a single member in the caller's workspace by their id.
 *
 * Scoped to the caller's workspace, so a member that belongs to another workspace
 * reads as `MEMBER_NOT_FOUND` rather than being exposed.
 *
 * @param workspace - The workspace the request is scoped to; scopes the lookup.
 * @param memberId - The member id; must be a valid UUID or `INVALID_INPUT` is returned.
 * @returns The `WorkspaceMember` (200), `MEMBER_NOT_FOUND` (404), or an error response.
 */
export const workspaceMemberGetById = async (
  workspace: WorkspaceContext,
  memberId: unknown
): Promise<Response<WorkspaceMember>> => {
  try {
    const parsedMemberId = validateField(z.uuid(), memberId, 'memberId');

    if (!parsedMemberId.success) {
      return parsedMemberId.response;
    }

    const result = await findMember(workspace.id, parsedMemberId.data);

    if (!result) {
      return errorResponse(MEMBER_ERRORS, 'MEMBER_NOT_FOUND');
    }

    return { status: 200, body: toMemberResponse(result) };
  } catch (error) {
    logger.error(error);

    return errorResponse(BASE_ERRORS, 'INTERNAL_ERROR');
  }
};

/**
 * Changes another member's role, enforcing the workspace's role invariants.
 *
 * A caller can't change their own role; only an owner may grant or revoke the
 * owner role (which also stops an admin from demoting an owner); a suspended
 * member can't be modified; and the last active owner can never be demoted. That
 * last check runs under a row lock (see `countActiveOwnersForUpdate`) so
 * concurrent demotions can't race the workspace down to zero owners.
 *
 * @param workspace - The workspace the request is scoped to; scopes the change.
 * @param member - The caller's workspace membership; supplies their id and role.
 * @param memberId - The target member id; must be a valid UUID or `INVALID_INPUT` is returned.
 * @param payload - The new role; validated against `WorkspaceMemberRoleUpdateSchema`.
 * @returns The updated `WorkspaceMember` (200), a caller-policy error (403), a
 *   member-state error (409), `MEMBER_NOT_FOUND` (404), or an error response.
 */
export const workspaceMemberChangeRole = async (
  workspace: WorkspaceContext,
  member: MemberContext,
  memberId: unknown,
  payload: WorkspaceMemberRoleUpdate
): Promise<Response<WorkspaceMember>> => {
  try {
    const parsedMemberId = validateField(z.uuid(), memberId, 'memberId');

    if (!parsedMemberId.success) {
      return parsedMemberId.response;
    }

    const parsedPayload = validateRequestBody(WorkspaceMemberRoleUpdateSchema, payload);

    if (!parsedPayload.success) {
      return parsedPayload.response;
    }

    if (parsedMemberId.data === member.id) {
      return errorResponse(MEMBER_ERRORS, 'MEMBER_SELF_ROLE_UPDATE');
    }

    const target = await findMember(workspace.id, parsedMemberId.data);

    if (!target) {
      return errorResponse(MEMBER_ERRORS, 'MEMBER_NOT_FOUND');
    }

    if (target.status === 'suspended') {
      return errorResponse(MEMBER_ERRORS, 'MEMBER_TARGET_SUSPENDED');
    }

    const newRole = parsedPayload.data.role;

    // Only an owner may grant the owner role, or change an existing owner's
    // role. The second half also stops an admin from demoting an owner - the
    // only other path that could leave the workspace with zero owners.
    if (member.role !== 'owner' && (newRole === 'owner' || target.role === 'owner')) {
      return errorResponse(MEMBER_ERRORS, 'MEMBER_OWNER_ROLE_FORBIDDEN');
    }

    // No-op: nothing to change, and skipping the write avoids a needless
    // last-owner check when the role is already what was requested.
    if (newRole === target.role) {
      return { status: 200, body: toMemberResponse(target) };
    }

    const result = await getDb().transaction(async (tx) => {
      // Demoting an active owner must never remove the workspace's last one.
      // The count is locked (FOR UPDATE) so concurrent demotions can't both
      // pass and race the owner count to zero.
      if (target.role === 'owner' && target.status === 'active') {
        const activeOwners = await countActiveOwnersForUpdate(tx, workspace.id);

        if (activeOwners <= 1) {
          return 'LAST_OWNER' as const;
        }
      }

      const [updated] = await tx
        .update(schema.workspaceMember)
        .set({ role: newRole })
        .where(
          and(
            eq(schema.workspaceMember.workspaceId, workspace.id),
            eq(schema.workspaceMember.id, parsedMemberId.data)
          )
        )
        .returning();

      if (!updated) {
        return undefined;
      }

      // A promotion or demotion moves the contact between segments, so the row is
      // queued with the role change rather than after it.
      const audience = await audienceStateForMember(tx, parsedMemberId.data);

      if (!audience) {
        logger.error(
          { memberId: parsedMemberId.data },
          'no audience state for a member whose role changed, contact left unsynced'
        );

        return updated;
      }

      await pushToOutbox(tx, {
        channel: 'audience',
        topic: 'contact:sync',
        to: audience.email,
        variables: {
          contact_first_name: audience.firstName,
          contact_last_name: audience.lastName,
          contact_segments: audience.segments,
          contact_topics: [],
        },
      });

      return updated;
    });

    if (result === 'LAST_OWNER') {
      return errorResponse(MEMBER_ERRORS, 'MEMBER_LAST_OWNER');
    }

    if (!result) {
      return errorResponse(MEMBER_ERRORS, 'MEMBER_NOT_FOUND');
    }

    return { status: 200, body: toMemberResponse(result) };
  } catch (error) {
    logger.error(error);

    return errorResponse(BASE_ERRORS, 'INTERNAL_ERROR');
  }
};

/**
 * Removes (soft-deletes) another member from the workspace.
 *
 * Delegates to the shared `suspendMember`, which flips the member to `suspended`
 * (keeping the row so it can be reactivated on re-invite) and refuses if they are
 * the last active owner. A caller can't remove themselves - that's
 * `workspaceMemberLeave` - and an admin can only remove plain members, not owners
 * or other admins.
 *
 * @param workspace - The workspace the request is scoped to; scopes the removal.
 * @param member - The caller's workspace membership; supplies their id and role.
 * @param memberId - The target member id; must be a valid UUID or `INVALID_INPUT` is returned.
 * @param payload - Removal options; validated against `WorkspaceMemberRemoveSchema`.
 * @returns `204 No Content` on success, a caller-policy error (403),
 *   `MEMBER_LAST_OWNER` (409), `MEMBER_NOT_FOUND` (404), or an error response.
 */
export const workspaceMemberRemove = async (
  workspace: WorkspaceContext,
  member: MemberContext,
  memberId: unknown,
  payload: WorkspaceMemberRemove
): Promise<NoContentResponse> => {
  try {
    const parsedMemberId = validateField(z.uuid(), memberId, 'memberId');

    if (!parsedMemberId.success) {
      return parsedMemberId.response;
    }

    // @TODO: It accepts a reassignToMemberId as payload, we can use it to reassign anything to a new member
    // The whole body is optional, so a request with none normalizes to `{}`.
    const parsedPayload = validateRequestBody(WorkspaceMemberRemoveSchema, payload ?? {});

    if (!parsedPayload.success) {
      return parsedPayload.response;
    }

    if (parsedMemberId.data === member.id) {
      return errorResponse(MEMBER_ERRORS, 'MEMBER_SELF_REMOVE');
    }

    const target = await findMember(workspace.id, parsedMemberId.data);

    if (!target || target.status === 'suspended') {
      return errorResponse(MEMBER_ERRORS, 'MEMBER_NOT_FOUND');
    }

    if (member.role === 'admin' && target.role !== 'member') {
      return errorResponse(MEMBER_ERRORS, 'MEMBER_REMOVE_FORBIDDEN');
    }

    const result = await suspendMember(target, async (tx) => {
      // Read after the suspension, inside the same transaction, so the segments
      // reflect the membership that just ended. The actor is not the target here,
      // so this goes through the function that can see the target's other
      // workspaces rather than the caller's own rows.
      const audience = await audienceStateForMember(tx, parsedMemberId.data);

      if (!audience) {
        logger.error(
          { memberId: parsedMemberId.data },
          'no audience state for a removed member, contact left unsynced'
        );

        return;
      }

      await pushToOutbox(tx, {
        channel: 'audience',
        topic: 'contact:sync',
        to: audience.email,
        variables: {
          contact_first_name: audience.firstName,
          contact_last_name: audience.lastName,
          contact_segments: audience.segments,
          contact_topics: [],
        },
      });
    });

    if (result === 'LAST_OWNER') {
      return errorResponse(MEMBER_ERRORS, 'MEMBER_LAST_OWNER');
    }

    if (!result) {
      return errorResponse(MEMBER_ERRORS, 'MEMBER_NOT_FOUND');
    }

    return { status: 204, body: null };
  } catch (error) {
    logger.error(error);

    return errorResponse(BASE_ERRORS, 'INTERNAL_ERROR');
  }
};

/**
 * Removes the caller from the workspace (self-service "leave").
 *
 * Unlike `workspaceMemberRemove` this needs no `member:manage` permission - any
 * member can leave - so its route is gated on workspace access only. The shared
 * `suspendMember` guard still refuses if the caller is the last active owner,
 * keeping the "always at least one owner" invariant.
 *
 * @param workspace - The workspace the request is scoped to; scopes the lookup.
 * @param member - The caller's workspace membership; identifies the row to remove.
 * @returns `204 No Content` on success, `MEMBER_LAST_OWNER` (409), `MEMBER_NOT_FOUND` (404), or an error response.
 */
export const workspaceMemberLeave = async (
  workspace: WorkspaceContext,
  member: MemberContext,
  user: SessionUser
): Promise<NoContentResponse> => {
  try {
    const self = await findMember(workspace.id, member.id);

    if (!self || self.status === 'suspended') {
      return errorResponse(MEMBER_ERRORS, 'MEMBER_NOT_FOUND');
    }

    const result = await suspendMember(self, async (tx) => {
      await pushToOutbox(tx, {
        channel: 'audience',
        topic: 'contact:sync',
        to: user.email,
        variables: {
          contact_first_name: user.firstName,
          contact_last_name: user.lastName,
          contact_segments: await audienceSegmentsForSelf(tx, user.id),
          contact_topics: [],
        },
      });
    });

    if (result === 'LAST_OWNER') {
      return errorResponse(MEMBER_ERRORS, 'MEMBER_LAST_OWNER');
    }

    if (!result) {
      return errorResponse(MEMBER_ERRORS, 'MEMBER_NOT_FOUND');
    }

    return { status: 204, body: null };
  } catch (error) {
    logger.error(error);

    return errorResponse(BASE_ERRORS, 'INTERNAL_ERROR');
  }
};

/**
 * Updates the caller's own profile fields (`displayName`, `title`, `phone`).
 *
 * Self-service, so its route is gated on workspace access only - no
 * `member:manage`. Role and status are out of scope here (see
 * `workspaceMemberChangeRole` and `workspaceMemberRemove`).
 *
 * @param workspace - The workspace the request is scoped to; scopes the update.
 * @param member - The caller's workspace membership; identifies the row to update.
 * @param payload - The profile fields to change; validated against `WorkspaceMemberUpdateSchema`.
 * @returns The updated `WorkspaceMember` (200), `MEMBER_NOT_FOUND` (404), or an error response.
 */
export const workspaceMemberUpdate = async (
  workspace: WorkspaceContext,
  member: MemberContext,
  payload: WorkspaceMemberUpdate
): Promise<Response<WorkspaceMember>> => {
  try {
    const parsedPayload = validateRequestBody(WorkspaceMemberUpdateSchema, payload);

    if (!parsedPayload.success) {
      return parsedPayload.response;
    }

    const self = await findMember(workspace.id, member.id);

    if (!self || self.status === 'suspended') {
      return errorResponse(MEMBER_ERRORS, 'MEMBER_NOT_FOUND');
    }

    // Empty payload: return the member unchanged rather than let Drizzle throw on `.set({})`.
    if (Object.keys(parsedPayload.data).length === 0) {
      return { status: 200, body: toMemberResponse(self) };
    }

    const updated = await updateMember(workspace.id, member.id, parsedPayload.data);

    if (!updated) {
      return errorResponse(MEMBER_ERRORS, 'MEMBER_NOT_FOUND');
    }

    return {
      status: 200,
      body: toMemberResponse(updated),
    };
  } catch (error) {
    logger.error(error);

    return errorResponse(BASE_ERRORS, 'INTERNAL_ERROR');
  }
};

/**
 * Updates another member's profile fields (`displayName`, `title`, `phone`) by id.
 *
 * For owners and admins - its route requires `member:manage`. Scoped to the
 * caller's workspace, and a suspended member can't be edited. Role and status are
 * out of scope (see `workspaceMemberChangeRole` and `workspaceMemberRemove`).
 *
 * @param workspace - The workspace the request is scoped to; scopes the update.
 * @param memberId - The target member id; must be a valid UUID or `INVALID_INPUT` is returned.
 * @param payload - The profile fields to change; validated against `WorkspaceMemberUpdateSchema`.
 * @returns The updated `WorkspaceMember` (200), `MEMBER_TARGET_SUSPENDED` (409), `MEMBER_NOT_FOUND` (404), or an error response.
 */
export const workspaceMemberUpdateById = async (
  workspace: WorkspaceContext,
  memberId: unknown,
  payload: WorkspaceMemberUpdate
): Promise<Response<WorkspaceMember>> => {
  try {
    const parsedMemberId = validateField(z.uuid(), memberId, 'memberId');

    if (!parsedMemberId.success) {
      return parsedMemberId.response;
    }

    const parsedPayload = validateRequestBody(WorkspaceMemberUpdateSchema, payload);

    if (!parsedPayload.success) {
      return parsedPayload.response;
    }

    const target = await findMember(workspace.id, parsedMemberId.data);

    if (!target) {
      return errorResponse(MEMBER_ERRORS, 'MEMBER_NOT_FOUND');
    }

    if (target.status === 'suspended') {
      return errorResponse(MEMBER_ERRORS, 'MEMBER_TARGET_SUSPENDED');
    }

    // Empty payload: return the member unchanged rather than let Drizzle throw on `.set({})`.
    if (Object.keys(parsedPayload.data).length === 0) {
      return { status: 200, body: toMemberResponse(target) };
    }

    const updated = await updateMember(workspace.id, parsedMemberId.data, parsedPayload.data);

    if (!updated) {
      return errorResponse(MEMBER_ERRORS, 'MEMBER_NOT_FOUND');
    }

    return {
      status: 200,
      body: toMemberResponse(updated),
    };
  } catch (error) {
    logger.error(error);

    return errorResponse(BASE_ERRORS, 'INTERNAL_ERROR');
  }
};
