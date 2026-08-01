import { registry } from '#/config/openapi-registry.ts';
import { z } from 'zod';

import {
  ResponseErrorSchema,
  WorkspaceLocationCreateSchema,
  WorkspaceLocationMemberRemoveSchema,
  WorkspaceLocationSchema,
  WorkspaceLocationUpdateSchema,
} from '@ordre/core/schemas';

// Register the shared response schemas once as reusable components ($ref), so
// every operation below points at the same definition instead of re-inlining it.
const WorkspaceLocation = registry.register('WorkspaceLocation', WorkspaceLocationSchema);
const WorkspaceError = registry.register('ResponseError', ResponseErrorSchema);

const jsonError = (description: string) => ({
  description,
  content: { 'application/json': { schema: WorkspaceError } },
});

const idParams = z.object({ id: z.uuid() });
const locationParams = z.object({ id: z.uuid(), locationId: z.uuid() });
const locationMemberParams = z.object({ id: z.uuid(), locationId: z.uuid(), memberId: z.uuid() });

// Session cookie set by better-auth; matches the `cookieAuth` scheme declared in
// config/openapi.ts. Applied to every authenticated operation.
const authenticated = [{ cookieAuth: [] }];

/**
 * GET /workspace/{id}/location - list a workspace's locations.
 */
registry.registerPath({
  method: 'get',
  path: '/workspace/{id}/location',
  operationId: 'listWorkspaceLocations',
  tags: ['Workspace Location'],
  summary: "List a workspace's locations",
  security: authenticated,
  request: { params: idParams },
  responses: {
    200: {
      description: "The workspace's locations, default first",
      content: { 'application/json': { schema: z.array(WorkspaceLocation) } },
    },
    404: jsonError('No workspace matches the id'),
  },
});

/**
 * POST /workspace/{id}/location - create a location.
 */
registry.registerPath({
  method: 'post',
  path: '/workspace/{id}/location',
  operationId: 'createWorkspaceLocation',
  tags: ['Workspace Location'],
  summary: 'Create a workspace location',
  security: authenticated,
  request: {
    params: idParams,
    body: { content: { 'application/json': { schema: WorkspaceLocationCreateSchema } } },
  },
  responses: {
    201: {
      description: 'The created location',
      content: { 'application/json': { schema: WorkspaceLocation } },
    },
    400: jsonError('The payload failed validation'),
    402: jsonError("The plan's location limit is reached"),
    403: jsonError('The caller lacks workspace:location:manage'),
    404: jsonError('No workspace matches the id'),
  },
});

/**
 * GET /workspace/{id}/location/{locationId} - fetch a location by id.
 */
registry.registerPath({
  method: 'get',
  path: '/workspace/{id}/location/{locationId}',
  operationId: 'getWorkspaceLocationById',
  tags: ['Workspace Location'],
  summary: 'Get a workspace location by id',
  security: authenticated,
  request: { params: locationParams },
  responses: {
    200: {
      description: 'The location',
      content: { 'application/json': { schema: WorkspaceLocation } },
    },
    400: jsonError('The location id is not a valid UUID'),
    404: jsonError('No location matches the id in this workspace'),
  },
});

/**
 * PATCH /workspace/{id}/location/{locationId} - update a location.
 */
registry.registerPath({
  method: 'patch',
  path: '/workspace/{id}/location/{locationId}',
  operationId: 'updateWorkspaceLocation',
  tags: ['Workspace Location'],
  summary: 'Update a workspace location',
  security: authenticated,
  request: {
    params: locationParams,
    body: { content: { 'application/json': { schema: WorkspaceLocationUpdateSchema } } },
  },
  responses: {
    200: {
      description: 'The updated location',
      content: { 'application/json': { schema: WorkspaceLocation } },
    },
    400: jsonError('The payload or location id failed validation'),
    404: jsonError('No location matches the id in this workspace'),
  },
});

/**
 * PUT /workspace/{id}/location/{locationId}/default - promote a location to default.
 */
registry.registerPath({
  method: 'put',
  path: '/workspace/{id}/location/{locationId}/default',
  operationId: 'setWorkspaceLocationDefault',
  tags: ['Workspace Location'],
  summary: "Set a location as the workspace's default",
  security: authenticated,
  request: { params: locationParams },
  responses: {
    200: {
      description: 'The promoted location',
      content: { 'application/json': { schema: WorkspaceLocation } },
    },
    400: jsonError('The location id is not a valid UUID'),
    404: jsonError('No location matches the id in this workspace'),
  },
});

/**
 * DELETE /workspace/{id}/location/{locationId} - delete a location, reassigning
 * its members and invites to the workspace's default location.
 */
registry.registerPath({
  method: 'delete',
  path: '/workspace/{id}/location/{locationId}',
  operationId: 'deleteWorkspaceLocation',
  tags: ['Workspace Location'],
  summary: 'Delete a workspace location',
  security: authenticated,
  request: { params: locationParams },
  responses: {
    204: { description: 'The location was deleted' },
    400: jsonError('The location id is not a valid UUID'),
    404: jsonError('No location matches the id in this workspace'),
    409: jsonError("The location is the workspace's default and can't be deleted"),
  },
});

/**
 * PUT /workspace/{id}/location/{locationId}/member/{memberId} - assign a member
 * to a location. Idempotent: re-assigning an already-assigned member still 204s.
 */
registry.registerPath({
  method: 'put',
  path: '/workspace/{id}/location/{locationId}/member/{memberId}',
  operationId: 'assignWorkspaceLocationMember',
  tags: ['Workspace Location'],
  summary: 'Assign a member to a location',
  security: authenticated,
  request: { params: locationMemberParams },
  responses: {
    204: { description: 'The member is assigned to the location' },
    400: jsonError('The location id or member id is not a valid UUID'),
    404: jsonError('No location or member matches the id in this workspace'),
  },
});

/**
 * DELETE /workspace/{id}/location/{locationId}/member/{memberId} - unassign a
 * member from a location. Idempotent: unassigning an unassigned member still 204s.
 */
registry.registerPath({
  method: 'delete',
  path: '/workspace/{id}/location/{locationId}/member/{memberId}',
  operationId: 'unassignWorkspaceLocationMember',
  tags: ['Workspace Location'],
  summary: 'Unassign a member from a location',
  security: authenticated,
  request: {
    params: locationMemberParams,
    body: { content: { 'application/json': { schema: WorkspaceLocationMemberRemoveSchema } } },
  },
  responses: {
    204: { description: 'The member is no longer assigned to the location' },
    400: jsonError('The location id, member id, or payload failed validation'),
  },
});
