import type { Request } from 'express';

/**
 * Type guard: narrows to `WorkspaceMemberRequest` when both `authenticate` and
 * `requireWorkspaceAccess` have run (i.e. `req.user`, `req.workspace` and
 * `req.member` are set).
 */
export const isWorkspaceMember = (req: Request): req is WorkspaceMemberRequest =>
  Boolean(req.user?.id && req.workspace?.id && req.member?.role);
