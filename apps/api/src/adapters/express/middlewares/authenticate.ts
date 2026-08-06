import { auth } from '#/config/auth.ts';
import { fromNodeHeaders } from 'better-auth/node';
import type { NextFunction, Request, Response } from 'express';

import { BASE_ERRORS, errorResponse } from '@ordre/core/errors';

/**
 * Middleware to get the user session based on the request cookies.
 *
 * On a valid session it populates `req.user` (see the Express `Request`
 * augmentation in `src/types/express.d.ts`) and continues. Missing session ->
 * 401. Any thrown error is forwarded to the central error handler.
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });

    if (!session) {
      const { status, body } = errorResponse(BASE_ERRORS, 'UNAUTHORIZED');

      return res.status(status).json(body);
    }

    req.user = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
    };

    next();
  } catch (error) {
    return next(error);
  }
};
