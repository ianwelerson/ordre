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

import {
  locationCollectionPath,
  locationDefaultPath,
  locationItemPath,
  locationMemberPath,
} from './workspace.paths.ts';

// `mergeParams` so the `:id` from the parent mount (`/workspace/:id/location`) is
// visible here - `requireWorkspaceAccess` resolves the workspace from `req.params.id`.
const locationRouter: Router = Router({ mergeParams: true });

locationRouter.get(
  locationCollectionPath,
  requireWorkspaceAccess,
  requireWorkspacePermission('workspace:location:read'),
  sendMemberResult((req) => workspaceLocationGetAll(req.workspace))
);

locationRouter.post(
  locationCollectionPath,
  requireWorkspaceAccess,
  requireWorkspacePermission('workspace:location:manage'),
  requireWorkspaceQuota('location'),
  sendMemberResult((req) => workspaceLocationCreate(req.workspace, req.body))
);

locationRouter.put(
  locationDefaultPath,
  requireWorkspaceAccess,
  requireWorkspacePermission('workspace:location:manage'),
  sendMemberResult((req) => workspaceLocationSetDefault(req.workspace, req.params?.locationId))
);

locationRouter.get(
  locationItemPath,
  requireWorkspaceAccess,
  requireWorkspacePermission('workspace:location:read'),
  sendMemberResult((req) => workspaceLocationGetById(req.workspace, req.params?.locationId))
);

locationRouter.patch(
  locationItemPath,
  requireWorkspaceAccess,
  requireWorkspacePermission('workspace:location:manage'),
  sendMemberResult((req) =>
    workspaceLocationUpdate(req.workspace, req.params?.locationId, req.body)
  )
);

locationRouter.delete(
  locationItemPath,
  requireWorkspaceAccess,
  requireWorkspacePermission('workspace:location:manage'),
  sendMemberResult((req) => workspaceLocationDelete(req.workspace, req.params?.locationId))
);

/** --- Add and remove location member */
locationRouter.put(
  locationMemberPath,
  requireWorkspaceAccess,
  requireWorkspacePermission('workspace:location:manage'),
  sendMemberResult((req) =>
    workspaceLocationMemberAssign(req.workspace, req.params?.locationId, req.params?.memberId)
  )
);

locationRouter.delete(
  locationMemberPath,
  requireWorkspaceAccess,
  requireWorkspacePermission('workspace:location:manage'),
  sendMemberResult((req) =>
    workspaceLocationMemberUnassign(req.params?.locationId, req.params?.memberId, req.body)
  )
);

export default locationRouter;
