import { requireWorkspaceAccess } from '#/adapters/express/middlewares/workspace-access.ts';
import { requireWorkspacePermission } from '#/adapters/express/middlewares/workspace-permission.ts';
import { sendMemberResult } from '#/adapters/express/utils/send-result.ts';
import {
  workspaceMemberChangeRole,
  workspaceMemberGetAll,
  workspaceMemberGetById,
  workspaceMemberGetSelf,
  workspaceMemberLeave,
  workspaceMemberRemove,
  workspaceMemberUpdate,
  workspaceMemberUpdateById,
} from '#controllers/workspace';
import { Router } from 'express';

import { API_ROUTES } from '@ordre/core/constants';

const memberRouter: Router = Router();

memberRouter.get(
  API_ROUTES.workspace.member.collection,
  requireWorkspaceAccess,
  requireWorkspacePermission('workspace:member:manage'),
  sendMemberResult((req) => workspaceMemberGetAll(req.workspace))
);

/**
 * Self-service profile get, update and leave - any member may do these to their own
 * membership, so they're gated on workspace access only (no `member:manage`).
 * Registered before the `/:memberId` routes so the literal paths are never
 * captured as a member id.
 */
memberRouter.get(
  API_ROUTES.workspace.member.self,
  requireWorkspaceAccess,
  sendMemberResult((req) => workspaceMemberGetSelf(req.workspace, req.member))
);

memberRouter.patch(
  API_ROUTES.workspace.member.self,
  requireWorkspaceAccess,
  sendMemberResult((req) => workspaceMemberUpdate(req.workspace, req.member, req.body))
);

memberRouter.post(
  API_ROUTES.workspace.member.leave,
  requireWorkspaceAccess,
  sendMemberResult((req) => workspaceMemberLeave(req.workspace, req.member))
);

memberRouter.get(
  API_ROUTES.workspace.member.byId,
  requireWorkspaceAccess,
  requireWorkspacePermission('workspace:member:manage'),
  sendMemberResult((req) => workspaceMemberGetById(req.workspace, req.params.memberId))
);

memberRouter.patch(
  API_ROUTES.workspace.member.byId,
  requireWorkspaceAccess,
  requireWorkspacePermission('workspace:member:manage'),
  sendMemberResult((req) => workspaceMemberUpdateById(req.workspace, req.params.memberId, req.body))
);

memberRouter.delete(
  API_ROUTES.workspace.member.byId,
  requireWorkspaceAccess,
  requireWorkspacePermission('workspace:member:manage'),
  sendMemberResult((req) =>
    workspaceMemberRemove(req.workspace, req.member, req.params.memberId, req.body)
  )
);

memberRouter.post(
  API_ROUTES.workspace.member.role,
  requireWorkspaceAccess,
  requireWorkspacePermission('workspace:member:manage'),
  sendMemberResult((req) =>
    workspaceMemberChangeRole(req.workspace, req.member, req.params.memberId, req.body)
  )
);

export default memberRouter;
