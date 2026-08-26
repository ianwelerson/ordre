import { runWithLocale } from '#/config/request-context.ts';
import type { NextFunction, Request, Response } from 'express';

import { negotiateLocale } from '@ordre/core/messages';

/**
 * Resolves the request's locale from `Accept-Language` and binds it for the rest
 * of the request.
 *
 * Mounted above the routes so it also covers the Better Auth handler, which
 * produces the `account:*` emails. Those run before there is a session, so the
 * database context opened by `rlsContext` does not exist yet and cannot carry
 * this.
 *
 * The value is read by `pushToOutbox`, which freezes it into the outbox row: the
 * worker delivers with no request in scope and can never negotiate for itself.
 */
export const requestLocale = (req: Request, _res: Response, next: NextFunction) => {
  runWithLocale(negotiateLocale(req.headers['accept-language']), next);
};
