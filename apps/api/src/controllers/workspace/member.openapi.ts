import { registry } from '#/config/openapi-registry.ts';
import { z } from 'zod';

import { API_ROUTES, toOpenApiPath } from '@ordre/core/constants';
import {
  ResponseErrorSchema,
  WorkspaceMemberRemoveSchema,
  WorkspaceMemberRoleUpdateSchema,
  WorkspaceMemberSchema,
  WorkspaceMemberUpdateSchema,
} from '@ordre/core/schemas';

// Register the shared response schemas once as reusable components ($ref), so
// every operation below points at the same definition instead of re-inlining it.
const WorkspaceMember = registry.register('WorkspaceMember', WorkspaceMemberSchema);
const WorkspaceError = registry.register('ResponseError', ResponseErrorSchema);

const jsonError = (description: string) => ({
  description,
  content: { 'application/json': { schema: WorkspaceError } },
});

const idParams = z.object({ id: z.uuid() });
const memberParams = z.object({ id: z.uuid(), memberId: z.uuid() });

// Session cookie set by better-auth; matches the `cookieAuth` scheme declared in
// config/openapi.ts. Applied to every authenticated operation.
const authenticated = [{ cookieAuth: [] }];

/**
 * GET /workspace/{id}/member - list a workspace's members.
 */
registry.registerPath({
  method: 'get',
  path: toOpenApiPath(API_ROUTES.workspace.member.collection),
  operationId: 'listWorkspaceMembers',
  tags: ['Workspace Member'],
  summary: "List a workspace's members",
  security: authenticated,
  request: { params: idParams },
  responses: {
    200: {
      description: "The workspace's members, newest first",
      content: { 'application/json': { schema: z.array(WorkspaceMember) } },
    },
    403: jsonError('The caller lacks workspace:member:manage'),
    404: jsonError('No workspace matches the id'),
  },
});

/**
 * GET /workspace/{id}/member/me - fetch the caller's own membership.
 *
 * Self-service: gated on workspace access only (no member:manage), so any member
 * can read their own membership, with their assigned locations embedded.
 */
registry.registerPath({
  method: 'get',
  path: toOpenApiPath(API_ROUTES.workspace.member.self),
  operationId: 'getOwnWorkspaceMember',
  tags: ['Workspace Member'],
  summary: "Get the caller's own membership",
  security: authenticated,
  request: { params: idParams },
  responses: {
    200: {
      description: "The caller's membership",
      content: { 'application/json': { schema: WorkspaceMember } },
    },
    401: jsonError('No active session'),
    404: jsonError('The caller is not a member of this workspace'),
  },
});

/**
 * PATCH /workspace/{id}/member/me - update the caller's own membership profile.
 *
 * Self-service: gated on workspace access only. Updates the caller's own
 * `displayName` / `title` / `phone`; role and status are never editable here.
 */
registry.registerPath({
  method: 'patch',
  path: toOpenApiPath(API_ROUTES.workspace.member.self),
  operationId: 'updateOwnWorkspaceMember',
  tags: ['Workspace Member'],
  summary: "Update the caller's own membership profile",
  security: authenticated,
  request: {
    params: idParams,
    body: { content: { 'application/json': { schema: WorkspaceMemberUpdateSchema } } },
  },
  responses: {
    200: {
      description: 'The updated membership',
      content: { 'application/json': { schema: WorkspaceMember } },
    },
    400: jsonError('The payload failed validation'),
    401: jsonError('No active session'),
    404: jsonError('The caller is not a member of this workspace'),
  },
});

/**
 * POST /workspace/{id}/member/leave - the caller leaves the workspace.
 *
 * Self-service (workspace access only). A soft removal - the caller's membership
 * is suspended - but refused when they are the workspace's last active owner.
 */
registry.registerPath({
  method: 'post',
  path: toOpenApiPath(API_ROUTES.workspace.member.leave),
  operationId: 'leaveWorkspace',
  tags: ['Workspace Member'],
  summary: 'Leave the workspace',
  security: authenticated,
  request: { params: idParams },
  responses: {
    204: { description: 'The caller left the workspace' },
    401: jsonError('No active session'),
    404: jsonError('The caller is not a member of this workspace'),
    409: jsonError('The caller is the last active owner and cannot leave'),
  },
});

/**
 * GET /workspace/{id}/member/{memberId} - fetch a member by id.
 */
registry.registerPath({
  method: 'get',
  path: toOpenApiPath(API_ROUTES.workspace.member.byId),
  operationId: 'getWorkspaceMemberById',
  tags: ['Workspace Member'],
  summary: 'Get a workspace member by id',
  security: authenticated,
  request: { params: memberParams },
  responses: {
    200: {
      description: 'The member',
      content: { 'application/json': { schema: WorkspaceMember } },
    },
    400: jsonError('The member id is not a valid UUID'),
    403: jsonError('The caller lacks workspace:member:manage'),
    404: jsonError('No member matches the id in this workspace'),
  },
});

/**
 * PATCH /workspace/{id}/member/{memberId} - update another member's profile.
 */
registry.registerPath({
  method: 'patch',
  path: toOpenApiPath(API_ROUTES.workspace.member.byId),
  operationId: 'updateWorkspaceMemberById',
  tags: ['Workspace Member'],
  summary: "Update a member's profile",
  security: authenticated,
  request: {
    params: memberParams,
    body: { content: { 'application/json': { schema: WorkspaceMemberUpdateSchema } } },
  },
  responses: {
    200: {
      description: 'The updated member',
      content: { 'application/json': { schema: WorkspaceMember } },
    },
    400: jsonError('The payload or member id failed validation'),
    403: jsonError('The caller lacks workspace:member:manage'),
    404: jsonError('No member matches the id in this workspace'),
  },
});

/**
 * DELETE /workspace/{id}/member/{memberId} - remove a member from the workspace.
 *
 * A soft removal (the member is suspended, keeping the row for re-invite). The
 * body is optional; a future `reassignToMemberId` will move the member's work to
 * another member. An admin may only remove plain members, never owners/admins,
 * and the workspace's last active owner can never be removed.
 */
registry.registerPath({
  method: 'delete',
  path: toOpenApiPath(API_ROUTES.workspace.member.byId),
  operationId: 'removeWorkspaceMember',
  tags: ['Workspace Member'],
  summary: 'Remove a member from the workspace',
  security: authenticated,
  request: {
    params: memberParams,
    body: { content: { 'application/json': { schema: WorkspaceMemberRemoveSchema } } },
  },
  responses: {
    204: { description: 'The member was removed' },
    400: jsonError('The member id or payload failed validation'),
    403: jsonError(
      'The caller lacks workspace:member:manage, is removing themselves, or (as an admin) is removing an owner/admin'
    ),
    404: jsonError('No member matches the id in this workspace'),
    409: jsonError('The member is the last active owner'),
  },
});

/**
 * POST /workspace/{id}/member/{memberId}/role - change a member's role.
 *
 * Only an owner may grant or change the owner role. A member cannot change their
 * own role, and demoting the workspace's last active owner is refused.
 */
registry.registerPath({
  method: 'post',
  path: toOpenApiPath(API_ROUTES.workspace.member.role),
  operationId: 'changeWorkspaceMemberRole',
  tags: ['Workspace Member'],
  summary: "Change a member's role",
  security: authenticated,
  request: {
    params: memberParams,
    body: { content: { 'application/json': { schema: WorkspaceMemberRoleUpdateSchema } } },
  },
  responses: {
    200: {
      description: 'The member with the updated role',
      content: { 'application/json': { schema: WorkspaceMember } },
    },
    400: jsonError('The payload or member id failed validation'),
    403: jsonError(
      'The caller lacks workspace:member:manage, is changing their own role, or is granting/altering the owner role as a non-owner'
    ),
    404: jsonError('No member matches the id in this workspace'),
    409: jsonError('The target member is suspended, or the change would demote the last owner'),
  },
});
