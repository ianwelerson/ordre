import { isFeatureEnabled } from '#/services/feature.ts';
import type { NextFunction, Request, Response } from 'express';

import type { Feature } from '@ordre/core/enums';
import { errorResponse, FEATURE_DISABLED, FEATURE_ERRORS } from '@ordre/core/errors';

/**
 * Middleware factory that gates a route on a feature switch.
 *
 * Mount it ahead of the authorization guards. A switch closes a surface for
 * everyone, so the answer does not depend on who is asking, and checking first
 * keeps a closed route from running membership and permission queries it will
 * refuse anyway.
 *
 * @param key - The feature the route belongs to.
 * @returns An Express middleware that refuses the request while `key` is off.
 */
export const requireFeature =
  (key: Feature) => async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (await isFeatureEnabled(key)) {
        return next();
      }

      const { status, body } = errorResponse(FEATURE_ERRORS, FEATURE_DISABLED[key]);

      return res.status(status).json(body);
    } catch (error) {
      return next(error);
    }
  };
