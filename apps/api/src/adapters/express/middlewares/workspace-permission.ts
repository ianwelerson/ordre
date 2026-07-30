import type { NextFunction, Request, Response } from 'express';

import { AUTH_ERRORS, errorResponse } from '@ordre/core/errors';
import { can, type WorkspacePermission } from '@ordre/core/permissions';

/**
 * Middleware factory that gates a route on a workspace permission - the
 * action-level check for RBAC.
 *
 * Must run after `requireWorkspaceAccess`, which populates `req.member`. It reads
 * the caller's role and tests it against `permission` via the `can` policy from
 * `@ordre/core/permissions`; a role that lacks the permission gets `FORBIDDEN`. A
 * missing `req.member` means the guard wasn't mounted first - that's a
 * misconfiguration, so it throws (surfacing as a 500 via the central error
 * handler) rather than masking the wiring bug as a 403.
 *
 * @param permission - The permission the caller's role must hold to proceed.
 * @returns An Express middleware that enforces `permission`.
 */
export const requireWorkspacePermission =
  (permission: WorkspacePermission) => (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.member) {
        throw new Error(
          'requireWorkspacePermission: req.member is missing (mount requireWorkspaceAccess first)'
        );
      }

      if (!can(req.member.role, permission)) {
        const { status, body } = errorResponse(AUTH_ERRORS, 'FORBIDDEN');

        return res.status(status).json(body);
      }

      next();
    } catch (error) {
      return next(error);
    }
  };
