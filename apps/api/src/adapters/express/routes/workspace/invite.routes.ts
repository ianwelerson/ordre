import { requireWorkspaceAccess } from '#/adapters/express/middlewares/workspace-access.ts';
import { requireWorkspacePermission } from '#/adapters/express/middlewares/workspace-permission.ts';
import { requireWorkspaceQuota } from '#/adapters/express/middlewares/workspace-quota.ts';
import { sendMemberResult } from '#/adapters/express/utils/send-result.ts';
import {
  workspaceInviteCreate,
  workspaceInviteDelete,
  workspaceInviteGetAll,
  workspaceInviteGetById,
} from '#controllers/workspace';
import { Router } from 'express';

import { inviteCollectionPath, inviteItemPath } from './workspace.paths.ts';

// `mergeParams` so the `:id` from the parent mount (`/workspace/:id/invite`) is
// visible here - `requireWorkspaceAccess` resolves the workspace from `req.params.id`.
const inviteRouter: Router = Router({ mergeParams: true });

inviteRouter.post(
  inviteCollectionPath,
  requireWorkspaceAccess,
  requireWorkspacePermission('workspace:member:manage'),
  requireWorkspaceQuota('seat'),
  sendMemberResult((req) => workspaceInviteCreate(req.member, req.body))
);

inviteRouter.get(
  inviteItemPath,
  requireWorkspaceAccess,
  requireWorkspacePermission('workspace:member:manage'),
  sendMemberResult((req) => workspaceInviteGetById(req.member, req.params.inviteId))
);

inviteRouter.get(
  inviteCollectionPath,
  requireWorkspaceAccess,
  requireWorkspacePermission('workspace:member:manage'),
  sendMemberResult((req) => workspaceInviteGetAll(req.member))
);

inviteRouter.delete(
  inviteItemPath,
  requireWorkspaceAccess,
  requireWorkspacePermission('workspace:member:manage'),
  sendMemberResult((req) => workspaceInviteDelete(req.member, req.params.inviteId))
);

export default inviteRouter;
