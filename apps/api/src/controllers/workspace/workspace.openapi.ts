import { registry } from '#/config/openapi-registry.ts';
import { z } from 'zod';

import { API_ROUTES, toOpenApiPath } from '@ordre/core/constants';
import { ResponseErrorSchema } from '@ordre/core/schemas';
import {
  WorkspaceCreateSchema,
  WorkspaceSchema,
  WorkspaceSlugExistsSchema,
  WorkspaceSummarySchema,
  WorkspaceUpdateSchema,
} from '@ordre/core/schemas';

// Register the shared response schemas once as reusable components ($ref), so
// every operation below points at the same definition instead of re-inlining it.
const Workspace = registry.register('Workspace', WorkspaceSchema);
const WorkspaceSummary = registry.register('WorkspaceSummary', WorkspaceSummarySchema);
const WorkspaceError = registry.register('ResponseError', ResponseErrorSchema);

const jsonError = (description: string) => ({
  description,
  content: { 'application/json': { schema: WorkspaceError } },
});

const idParams = z.object({ id: z.uuid() });
const slugParams = z.object({ slug: z.string() });

// Session cookie set by better-auth; matches the `cookieAuth` scheme declared in
// config/openapi.ts. Applied to every authenticated operation.
const authenticated = [{ cookieAuth: [] }];

/**
 * GET /workspace/slug/{slug}/exists - public slug availability check.
 */
registry.registerPath({
  method: 'get',
  path: toOpenApiPath(API_ROUTES.workspace.slugExists),
  operationId: 'workspaceSlugExists',
  tags: ['Workspace'],
  summary: 'Check whether a workspace slug is unavailable',
  request: { params: slugParams },
  responses: {
    200: {
      description: 'Whether the slug is unavailable, because it is taken or restricted',
      content: { 'application/json': { schema: WorkspaceSlugExistsSchema } },
    },
    400: jsonError('The slug failed validation'),
  },
});

/**
 * GET /workspace - list the workspaces the current user belongs to.
 */
registry.registerPath({
  method: 'get',
  path: toOpenApiPath(API_ROUTES.workspace.collection),
  operationId: 'listUserWorkspaces',
  tags: ['Workspace'],
  summary: "List the current user's workspaces (minimal)",
  security: authenticated,
  responses: {
    200: {
      description: "The user's workspaces as minimal summaries (empty if none)",
      content: { 'application/json': { schema: z.array(WorkspaceSummary) } },
    },
    401: jsonError('No active session'),
  },
});

/**
 * POST /workspace - create a workspace.
 */
registry.registerPath({
  method: 'post',
  path: toOpenApiPath(API_ROUTES.workspace.collection),
  operationId: 'createWorkspace',
  tags: ['Workspace'],
  summary: 'Create a workspace',
  security: authenticated,
  request: {
    body: { content: { 'application/json': { schema: WorkspaceCreateSchema } } },
  },
  responses: {
    201: {
      description: 'The created workspace',
      content: { 'application/json': { schema: Workspace } },
    },
    400: jsonError('The payload failed validation, or the slug is restricted'),
    409: jsonError('A workspace already uses this slug'),
  },
});

/**
 * GET /workspace/{id} - fetch a workspace by id.
 */
registry.registerPath({
  method: 'get',
  path: toOpenApiPath(API_ROUTES.workspace.byId),
  operationId: 'getWorkspaceById',
  tags: ['Workspace'],
  summary: 'Get a workspace By ID',
  security: authenticated,
  request: { params: idParams },
  responses: {
    200: {
      description: 'The workspace',
      content: { 'application/json': { schema: Workspace } },
    },
    400: jsonError('The id is not a valid UUID'),
    404: jsonError('No workspace matches the id'),
  },
});

/**
 * GET /workspace/slug/{slug} - fetch a workspace by slug.
 */
registry.registerPath({
  method: 'get',
  path: toOpenApiPath(API_ROUTES.workspace.bySlug),
  operationId: 'getWorkspaceBySlug',
  tags: ['Workspace'],
  summary: 'Get a workspace By Slug',
  security: authenticated,
  request: { params: slugParams },
  responses: {
    200: {
      description: 'The workspace',
      content: { 'application/json': { schema: Workspace } },
    },
    400: jsonError('The slug failed validation'),
    404: jsonError('No workspace matches the slug'),
  },
});

/**
 * DELETE /workspace/{id} - delete a workspace by id.
 */
registry.registerPath({
  method: 'delete',
  path: toOpenApiPath(API_ROUTES.workspace.byId),
  operationId: 'deleteWorkspace',
  tags: ['Workspace'],
  summary: 'Delete a workspace By ID',
  security: authenticated,
  request: { params: idParams },
  responses: {
    204: { description: 'The workspace was deleted' },
    400: jsonError('The id is not a valid UUID'),
    404: jsonError('No workspace matches the id'),
  },
});

/**
 * PATCH /workspace/{id} - update a workspace by id.
 */
registry.registerPath({
  method: 'patch',
  path: toOpenApiPath(API_ROUTES.workspace.byId),
  operationId: 'updateWorkspace',
  tags: ['Workspace'],
  summary: 'Update a workspace By ID',
  security: authenticated,
  request: {
    params: idParams,
    body: { content: { 'application/json': { schema: WorkspaceUpdateSchema } } },
  },
  responses: {
    200: {
      description: 'The updated workspace',
      content: { 'application/json': { schema: Workspace } },
    },
    400: jsonError('The payload failed validation, or the slug is restricted'),
    404: jsonError('No workspace matches the id'),
    409: jsonError('A workspace already uses this slug'),
  },
});
