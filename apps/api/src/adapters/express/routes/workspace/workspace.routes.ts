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
  workspaceSlugExists,
  workspaceUpdate,
} from '#controllers/workspace';
import { Router } from 'express';

import inviteRouter from './invite.routes.ts';
import locationRouter from './location.routes.ts';
import memberRouter from './member.routes.ts';
import {
  workspaceBasePath,
  workspaceCollectionPath,
  workspaceInviteBasePath,
  workspaceItemByIdPath,
  workspaceItemBySlugPath,
  workspaceLocationBasePath,
  workspaceMemberBasePath,
  workspaceSlugExistsPath,
} from './workspace.paths.ts';

const workspaceRouter: Router = Router();

// Unauthenticated routes
workspaceRouter.get(
  workspaceSlugExistsPath,
  sendResult((req) => workspaceSlugExists(req.params.slug))
);

// Authenticated routes
workspaceRouter.use(authenticate);

// Open the RLS context (app.user_id) for every authenticated request
workspaceRouter.use(rlsContext);

workspaceRouter.get(
  workspaceCollectionPath,
  sendAuthResult((req) => workspaceGetAll(req.user.id))
);

workspaceRouter.post(
  workspaceCollectionPath,
  sendAuthResult((req) => workspaceCreate(req.user, req.body))
);

workspaceRouter.get(
  workspaceItemByIdPath,
  requireWorkspaceAccess,
  requireWorkspacePermission('workspace:read'),
  sendMemberResult((req) => workspaceGetById(req.member, req.params.id))
);

workspaceRouter.get(
  workspaceItemBySlugPath,
  requireWorkspaceAccess,
  requireWorkspacePermission('workspace:read'),
  sendMemberResult((req) => workspaceGetBySlug(req.member, req.params.slug))
);

workspaceRouter.delete(
  workspaceItemByIdPath,
  requireWorkspaceAccess,
  requireWorkspacePermission('workspace:delete'),
  sendMemberResult((req) => workspaceDelete(req.params.id))
);

workspaceRouter.patch(
  workspaceItemByIdPath,
  requireWorkspaceAccess,
  requireWorkspacePermission('workspace:update'),
  sendMemberResult((req) => workspaceUpdate(req.workspace, req.member, req.body))
);

/**
 * Sub-router
 *
 * The sub-router uses `mergeParams` so it can still read `:id`.
 * Mounted after `authenticate` + `rlsContext` so those run for its requests too.
 */
workspaceRouter.use(workspaceLocationBasePath, locationRouter);
workspaceRouter.use(workspaceInviteBasePath, inviteRouter);
workspaceRouter.use(workspaceMemberBasePath, memberRouter);

const router: Router = Router();

// Mount every route above under the base path, so each one lives at `/workspace/{path}`.
router.use(workspaceBasePath, workspaceRouter);

export default router;
