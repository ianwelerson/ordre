import { runWithUser } from '#/config/db-context.ts';
import type { NextFunction, Request, Response } from 'express';

/**
 * Signals that the request transaction must roll back. Rejecting is the only way
 * to tell `db.transaction()` to roll back, so this is thrown as a control signal
 * rather than a real failure - `rlsContext` swallows it.
 */
class RollbackSignal extends Error {}

/**
 * Turns the rest of the request into a promise.
 *
 * Settles once the response has been fully sent (`finish`) or the connection
 * dropped (`close`) - the signal that no downstream handler will touch the
 * database again. Resolving commits the surrounding transaction; rejecting rolls
 * it back.
 *
 * A 5xx means the handler failed, so we roll back rather than commit whatever
 * landed before the error. A 4xx still commits - validation failures write
 * nothing anyway.
 */
const untilResponseDone = (res: Response, next: NextFunction) =>
  new Promise<void>((resolve, reject) => {
    res.on('finish', () => {
      if (res.statusCode >= 500) {
        return reject(new RollbackSignal());
      }

      resolve();
    });

    res.on('close', resolve);

    next();
  });

/**
 * Opens the per-request database context that Row-Level Security depends on.
 *
 * Must run after `authenticate` and before any guard that queries. It wraps the
 * rest of the request in `runWithUser`, which opens a transaction and pins
 * `app.user_id` to it via SET LOCAL. Every downstream query made through
 * `getDb()` runs on that transaction, so policies can tell who the caller is.
 *
 * Requests without a session pass straight through - no context means
 * `app.user_id` is unset and policies will match nobody.
 */
export const rlsContext = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next();
  }

  runWithUser(req.user.id, () => untilResponseDone(res, next)).catch((error: unknown) => {
    // The signal did its job - the transaction rolled back and the response was
    // already sent, so there is nothing left to report.
    if (error instanceof RollbackSignal) {
      return;
    }

    next(error);
  });
};
