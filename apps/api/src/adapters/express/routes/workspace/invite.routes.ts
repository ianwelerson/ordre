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

import { API_ROUTES } from '@ordre/core/constants';

const inviteRouter: Router = Router();

inviteRouter.post(
  API_ROUTES.workspace.invite.collection,
  requireWorkspaceAccess,
  requireWorkspacePermission('workspace:member:manage'),
  requireWorkspaceQuota('seat'),
  sendMemberResult((req) => workspaceInviteCreate(req.workspace, req.user, req.member, req.body))
);

inviteRouter.get(
  API_ROUTES.workspace.invite.byId,
  requireWorkspaceAccess,
  requireWorkspacePermission('workspace:member:manage'),
  sendMemberResult((req) => workspaceInviteGetById(req.workspace, req.params.inviteId))
);

inviteRouter.get(
  API_ROUTES.workspace.invite.collection,
  requireWorkspaceAccess,
  requireWorkspacePermission('workspace:member:manage'),
  sendMemberResult((req) => workspaceInviteGetAll(req.workspace))
);

inviteRouter.delete(
  API_ROUTES.workspace.invite.byId,
  requireWorkspaceAccess,
  requireWorkspacePermission('workspace:member:manage'),
  sendMemberResult((req) => workspaceInviteDelete(req.workspace, req.params.inviteId))
);

export default inviteRouter;
