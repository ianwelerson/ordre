import { requireFeature } from '#/adapters/express/middlewares/feature.ts';
import { requireWorkspaceAccess } from '#/adapters/express/middlewares/workspace-access.ts';
import { requireWorkspacePermission } from '#/adapters/express/middlewares/workspace-permission.ts';
import { requireWorkspaceQuota } from '#/adapters/express/middlewares/workspace-quota.ts';
import { sendMemberResult } from '#/adapters/express/utils/send-result.ts';
import {
  workspaceLocationCreate,
  workspaceLocationDelete,
  workspaceLocationGetAll,
  workspaceLocationGetById,
  workspaceLocationMemberAssign,
  workspaceLocationMemberUnassign,
  workspaceLocationSetDefault,
  workspaceLocationUpdate,
} from '#controllers/workspace';
import { Router } from 'express';

import { API_ROUTES } from '@ordre/core/constants';

const locationRouter: Router = Router();

locationRouter.get(
  API_ROUTES.workspace.location.collection,
  requireWorkspaceAccess,
  requireWorkspacePermission('workspace:location:read'),
  sendMemberResult((req) => workspaceLocationGetAll(req.workspace))
);

locationRouter.post(
  API_ROUTES.workspace.location.collection,
  requireFeature('workspace-location'),
  requireWorkspaceAccess,
  requireWorkspacePermission('workspace:location:manage'),
  requireWorkspaceQuota('location'),
  sendMemberResult((req) => workspaceLocationCreate(req.workspace, req.body))
);

locationRouter.put(
  API_ROUTES.workspace.location.default,
  requireWorkspaceAccess,
  requireWorkspacePermission('workspace:location:manage'),
  sendMemberResult((req) => workspaceLocationSetDefault(req.workspace, req.params?.locationId))
);

locationRouter.get(
  API_ROUTES.workspace.location.byId,
  requireWorkspaceAccess,
  requireWorkspacePermission('workspace:location:read'),
  sendMemberResult((req) => workspaceLocationGetById(req.workspace, req.params?.locationId))
);

locationRouter.patch(
  API_ROUTES.workspace.location.byId,
  requireWorkspaceAccess,
  requireWorkspacePermission('workspace:location:manage'),
  sendMemberResult((req) =>
    workspaceLocationUpdate(req.workspace, req.params?.locationId, req.body)
  )
);

locationRouter.delete(
  API_ROUTES.workspace.location.byId,
  requireWorkspaceAccess,
  requireWorkspacePermission('workspace:location:manage'),
  sendMemberResult((req) => workspaceLocationDelete(req.workspace, req.params?.locationId))
);

/** --- Add and remove location member */
locationRouter.put(
  API_ROUTES.workspace.location.member,
  requireWorkspaceAccess,
  requireWorkspacePermission('workspace:location:manage'),
  sendMemberResult((req) =>
    workspaceLocationMemberAssign(req.workspace, req.params?.locationId, req.params?.memberId)
  )
);

locationRouter.delete(
  API_ROUTES.workspace.location.member,
  requireWorkspaceAccess,
  requireWorkspacePermission('workspace:location:manage'),
  sendMemberResult((req) =>
    workspaceLocationMemberUnassign(req.params?.locationId, req.params?.memberId, req.body)
  )
);

export default locationRouter;
