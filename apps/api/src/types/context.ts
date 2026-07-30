import type { WorkspaceMemberRole } from '@ordre/core/enums';

/** The authenticated user attached to a request by the `authenticate` middleware. */
export interface SessionUser {
  id: string;
  email: string;
}

/**
 * The caller's workspace membership context, attached by the
 * `requireWorkspaceAccess` middleware.
 */
export interface WorkspaceMemberContext {
  id: string;
  workspaceId: string;
  role: WorkspaceMemberRole;
}
