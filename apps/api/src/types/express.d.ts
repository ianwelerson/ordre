import type { Request } from 'express';

import type { MemberContext, SessionUser, WorkspaceContext } from './context.ts';

// Augments Express's `Request` so `req.user` is available (and typed) on every
// handler once `authenticate` has populated it, and `req.workspace` / `req.member`
// once `requireWorkspaceAccess` has.
declare global {
  namespace Express {
    interface Request {
      user?: SessionUser;
      workspace?: WorkspaceContext;
      member?: MemberContext;
    }
  }

  // A `Request` guaranteed to have `user` populated - i.e. one that has passed
  // `authenticate`. References the full Express `Request` so it keeps
  // `params`, `body`, `status`, etc.
  type AuthenticatedRequest = Request & { user: NonNullable<Request['user']> };

  type WorkspaceMemberRequest = Request & {
    user: NonNullable<SessionUser>;
    workspace: NonNullable<WorkspaceContext>;
    member: NonNullable<MemberContext>;
  };
}

export {};
