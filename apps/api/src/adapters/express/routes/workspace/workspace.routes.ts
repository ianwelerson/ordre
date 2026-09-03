import { authenticate } from '#/adapters/express/middlewares/authenticate.ts';
import { rlsContext } from '#/adapters/express/middlewares/rls-context.ts';
import { requireWorkspaceAccess } from '#/adapters/express/middlewares/workspace-access.ts';
import { requireWorkspacePermission } from '#/adapters/express/middlewares/workspace-permission.ts';
import {
  sendAuthResult,
  sendMemberResult,
  sendResult,
} from '#/adapters/express/utils/send-result.ts';
import {
  workspaceCreate,
  workspaceDelete,
  workspaceGetAll,
  workspaceGetById,
  workspaceGetBySlug,
  workspaceSlugGetAvailability,
  workspaceUpdate,
} from '#controllers/workspace';
import { Router } from 'express';

import { API_ROUTES } from '@ordre/core/constants';

import inviteRouter from './invite.routes.ts';
import locationRouter from './location.routes.ts';
import memberRouter from './member.routes.ts';

const workspaceRouter: Router = Router();

// Unauthenticated routes
workspaceRouter.get(
  API_ROUTES.workspace.slugAvailability,
  sendResult((req) => workspaceSlugGetAvailability(req.params.slug))
);

/**
 * Authenticated routes.
 *
 * Both middlewares are scoped to the workspace subtree rather than applied to
 * the whole router: paths here are absolute, so this router mounts at the app
 * root, and an unscoped `use` would also run for the public invite routes
 * mounted after it (see routes/index.ts) - which must stay session-free.
 */
workspaceRouter.use(API_ROUTES.workspace.collection, authenticate);

// Open the RLS context (app.user_id) for every authenticated request
workspaceRouter.use(API_ROUTES.workspace.collection, rlsContext);

workspaceRouter.get(
  API_ROUTES.workspace.collection,
  sendAuthResult((req) => workspaceGetAll(req.user.id))
);

workspaceRouter.post(
  API_ROUTES.workspace.collection,
  sendAuthResult((req) => workspaceCreate(req.user, req.body))
);

workspaceRouter.get(
  API_ROUTES.workspace.byId,
  requireWorkspaceAccess,
  requireWorkspacePermission('workspace:read'),
  sendMemberResult((req) => workspaceGetById(req.member, req.params.id))
);

workspaceRouter.get(
  API_ROUTES.workspace.bySlug,
  requireWorkspaceAccess,
  requireWorkspacePermission('workspace:read'),
  sendMemberResult((req) => workspaceGetBySlug(req.member, req.params.slug))
);

workspaceRouter.delete(
  API_ROUTES.workspace.byId,
  requireWorkspaceAccess,
  requireWorkspacePermission('workspace:delete'),
  sendMemberResult((req) => workspaceDelete(req.params.id))
);

workspaceRouter.patch(
  API_ROUTES.workspace.byId,
  requireWorkspaceAccess,
  requireWorkspacePermission('workspace:update'),
  sendMemberResult((req) => workspaceUpdate(req.workspace, req.member, req.body))
);

/**
 * Sub-routers.
 *
 * They declare their own absolute paths, so they mount at the root of this
 * router rather than on a prefix - but still below the `authenticate` +
 * `rlsContext` scoping above, which covers the whole `/workspace` subtree.
 */
workspaceRouter.use(locationRouter);
workspaceRouter.use(inviteRouter);
workspaceRouter.use(memberRouter);

export default workspaceRouter;
