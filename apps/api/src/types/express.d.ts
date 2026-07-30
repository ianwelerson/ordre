import type { Request } from 'express';

import type { SessionUser, WorkspaceMemberContext } from './context.ts';

// Augments Express's `Request` so `req.user` is available (and typed) on every
// handler once `authenticate` has populated it.
declare global {
  namespace Express {
    interface Request {
      user?: SessionUser;
      member?: WorkspaceMemberContext;
    }
  }

  // A `Request` guaranteed to have `user` populated - i.e. one that has passed
  // `authenticate`. References the full Express `Request` so it keeps
  // `params`, `body`, `status`, etc.
  type AuthenticatedRequest = Request & { user: NonNullable<Request['user']> };

  type WorkspaceMemberRequest = Request & {
    user: NonNullable<SessionUser>;
    member: NonNullable<WorkspaceMemberContext>;
  };
}

export {};
