import type { Request } from 'express';

/** Type guard: narrows to `AuthenticatedRequest` when `authenticate` has populated `req.user`. */
export const isAuthenticated = (req: Request): req is AuthenticatedRequest => Boolean(req.user?.id);
