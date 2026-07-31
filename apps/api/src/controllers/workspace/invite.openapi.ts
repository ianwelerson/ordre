import { registry } from '#/config/openapi-registry.ts';
import { z } from 'zod';

import {
  ResponseErrorSchema,
  WorkspaceInviteCreateSchema,
  WorkspaceInvitePreviewSchema,
  WorkspaceInviteSchema,
} from '@ordre/core/schemas';

// Register the shared response schemas once as reusable components ($ref), so
// every operation below points at the same definition instead of re-inlining it.
const WorkspaceInvite = registry.register('WorkspaceInvite', WorkspaceInviteSchema);
const WorkspaceInvitePreview = registry.register(
  'WorkspaceInvitePreview',
  WorkspaceInvitePreviewSchema
);
const WorkspaceError = registry.register('ResponseError', ResponseErrorSchema);

const jsonError = (description: string) => ({
  description,
  content: { 'application/json': { schema: WorkspaceError } },
});

const idParams = z.object({ id: z.uuid() });
const inviteParams = z.object({ id: z.uuid(), inviteId: z.uuid() });
// The public routes key off the invite token (an opaque base64url string), not a UUID.
const tokenParams = z.object({ token: z.string() });

// Session cookie set by better-auth; matches the `cookieAuth` scheme declared in
// config/openapi.ts. Applied to every authenticated operation.
const authenticated = [{ cookieAuth: [] }];

/**
 * GET /workspace/{id}/invite - list every invite in a workspace.
 */
registry.registerPath({
  method: 'get',
  path: '/workspace/{id}/invite',
  operationId: 'listWorkspaceInvites',
  tags: ['Workspace Invite'],
  summary: "List a workspace's invites",
  security: authenticated,
  request: { params: idParams },
  responses: {
    200: {
      description: "The workspace's invites, newest first, regardless of status",
      content: { 'application/json': { schema: z.array(WorkspaceInvite) } },
    },
    404: jsonError('No workspace matches the id'),
  },
});

/**
 * POST /workspace/{id}/invite - create a pending invite.
 */
registry.registerPath({
  method: 'post',
  path: '/workspace/{id}/invite',
  operationId: 'createWorkspaceInvite',
  tags: ['Workspace Invite'],
  summary: 'Create a workspace invite',
  security: authenticated,
  request: {
    params: idParams,
    body: { content: { 'application/json': { schema: WorkspaceInviteCreateSchema } } },
  },
  responses: {
    201: {
      description: 'The created invite',
      content: { 'application/json': { schema: WorkspaceInvite } },
    },
    400: jsonError('The payload failed validation'),
    403: jsonError(
      "The caller lacks workspace:member:manage, or the plan's seat limit is reached (a pending invite holds a seat)"
    ),
    404: jsonError('No workspace matches the id, or the target location is not in this workspace'),
    409: jsonError('The email already belongs to a member or a pending invite'),
  },
});

/**
 * GET /workspace/{id}/invite/{inviteId} - fetch a single invite by id.
 */
registry.registerPath({
  method: 'get',
  path: '/workspace/{id}/invite/{inviteId}',
  operationId: 'getWorkspaceInviteById',
  tags: ['Workspace Invite'],
  summary: 'Get a workspace invite by id',
  security: authenticated,
  request: { params: inviteParams },
  responses: {
    200: {
      description: 'The invite',
      content: { 'application/json': { schema: WorkspaceInvite } },
    },
    400: jsonError('The invite id is not a valid UUID'),
    404: jsonError('No invite matches the id in this workspace'),
  },
});

/**
 * DELETE /workspace/{id}/invite/{inviteId} - delete a pending invite.
 *
 * Soft delete: the invite's status is set to `revoked` and the row is kept as
 * history, but it's presented as a standard DELETE returning `204 No Content`.
 */
registry.registerPath({
  method: 'delete',
  path: '/workspace/{id}/invite/{inviteId}',
  operationId: 'deleteWorkspaceInvite',
  tags: ['Workspace Invite'],
  summary: 'Delete a workspace invite',
  security: authenticated,
  request: { params: inviteParams },
  responses: {
    204: { description: 'The invite was deleted' },
    400: jsonError('The invite id is not a valid UUID'),
    404: jsonError('No pending invite matches the id in this workspace'),
  },
});

/**
 * GET /invite/{token} - public preview of an invite.
 *
 * Unauthenticated: it powers the invite landing page, which renders before the
 * invitee has an account. Returns a minimal projection (no token, no ids) for a
 * pending, non-expired invite; anything else is a 404.
 */
registry.registerPath({
  method: 'get',
  path: '/invite/{token}',
  operationId: 'previewInvite',
  tags: ['Workspace Invite'],
  summary: 'Preview an invite by token',
  request: { params: tokenParams },
  responses: {
    200: {
      description: 'The invite preview',
      content: { 'application/json': { schema: WorkspaceInvitePreview } },
    },
    404: jsonError('No pending, non-expired invite matches the token'),
  },
});

/**
 * POST /invite/{token}/accept - accept an invite as the current user.
 *
 * Requires a session (the invitee has signed up / logged in), but not workspace
 * membership. The accepting user is taken from the session, and the invite's
 * email must match that user's email.
 */
registry.registerPath({
  method: 'post',
  path: '/invite/{token}/accept',
  operationId: 'acceptInvite',
  tags: ['Workspace Invite'],
  summary: 'Accept an invite',
  security: authenticated,
  request: { params: tokenParams },
  responses: {
    204: {
      description: 'The invite was accepted (or had already been accepted by this user)',
    },
    401: jsonError('No active session'),
    403: jsonError("The invite was sent to a different email than the caller's"),
    404: jsonError('No pending, non-expired invite matches the token'),
  },
});

/**
 * POST /invite/{token}/decline - decline an invite by token.
 *
 * Public and token-only (no session): declining a pending invite flips it to
 * `declined`. POST (not GET) because it mutates.
 */
registry.registerPath({
  method: 'post',
  path: '/invite/{token}/decline',
  operationId: 'declineInvite',
  tags: ['Workspace Invite'],
  summary: 'Decline an invite',
  request: { params: tokenParams },
  responses: {
    204: { description: 'The invite was declined' },
    404: jsonError('No pending invite matches the token'),
  },
});
