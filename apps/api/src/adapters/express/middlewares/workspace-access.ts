import { getDb } from '#/config/db-context.ts';
import { and, eq } from 'drizzle-orm';
import type { NextFunction, Request, Response } from 'express';
import z from 'zod';

import {
  AUTH_ERRORS,
  errorResponse,
  VALIDATION_ERRORS,
  WORKSPACE_ERRORS,
} from '@ordre/core/errors';
import { WorkspaceCreateSchema } from '@ordre/core/schemas';
import * as schema from '@ordre/db/schemas';

/**
 * Middleware that gates a route on workspace membership - the resource-level
 * check for RBAC.
 *
 * Must run after `authenticate`. It resolves the target workspace from
 * the route params (`:id` directly, or `:slug` via a lookup), then loads the
 * caller's `workspace_member` row for that workspace. On success it populates
 * `req.member` (see the Express `Request` augmentation in
 * `src/types/express.d.ts`) with the member id, workspace id, and role, so the
 * downstream permission check can read the role.
 *
 * Returns `NOT_FOUND` both when the workspace can't be resolved and when the
 * caller isn't a member - the two are intentionally indistinguishable, so
 * membership can't be used to probe which workspaces exist. Any thrown error is
 * forwarded to the central error handler.
 */
export const requireWorkspaceAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      const { status, body } = errorResponse(AUTH_ERRORS, 'UNAUTHORIZED');

      return res.status(status).json(body);
    }

    const idParam = z.uuid().safeParse(req.params.id);
    const slugParam = WorkspaceCreateSchema.shape.slug.safeParse(req.params.slug);

    // A route carries either `:id` or `:slug`, so only fail when neither is valid.
    if (!idParam.success && !slugParam.success) {
      const { status, body } = errorResponse(VALIDATION_ERRORS, 'INVALID_INPUT', {
        id: req.params.id && JSON.parse(idParam.error.message)[0].message,
        slug: req.params.slug && JSON.parse(slugParam.error.message)[0].message,
      });

      return res.status(status).json(body);
    }

    let workspaceId: string | undefined =
      typeof idParam.data === 'string' ? idParam.data : undefined;

    if (!idParam.success && slugParam.success) {
      const workspace = await getDb().query.workspace.findFirst({
        where: eq(schema.workspace.slug, slugParam.data),
        columns: { id: true },
      });

      workspaceId = workspace?.id;
    }

    if (!workspaceId) {
      const { status, body } = errorResponse(WORKSPACE_ERRORS, 'NOT_FOUND');
      return res.status(status).json(body);
    }

    const member = await getDb().query.workspaceMember.findFirst({
      where: and(
        eq(schema.workspaceMember.userId, req.user.id),
        eq(schema.workspaceMember.workspaceId, workspaceId)
      ),
    });

    if (!member) {
      const { status, body } = errorResponse(WORKSPACE_ERRORS, 'NOT_FOUND');

      return res.status(status).json(body);
    }

    req.member = {
      id: member.id,
      workspaceId,
      role: member.role,
    };

    next();
  } catch (error) {
    return next(error);
  }
};
