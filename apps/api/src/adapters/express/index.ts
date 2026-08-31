import { pool } from '#/config/db.ts';
import { logger } from '#/config/logger.ts';
import { startOutboxWorker, stopOutboxWorker } from '#/workers/outbox.worker.ts';
import { env } from '#env';

import { app } from './server.ts';

const server = app.listen(env.PORT, () => {
  logger.info(`Server running on port ${env.PORT}`);
});

startOutboxWorker();

/**
 * Graceful shutdown: stop accepting new requests, let in-flight ones finish, then drain the DB pool.
 *
 * */
const shutdown = (signal: string) => {
  logger.info(`${signal} received, shutting down`);

  /**
   * Awaited below: an in-flight drain must finish before `pool.end()`,
   * or it queries a closing pool.
   *  */
  const outboxWorkerStopped = stopOutboxWorker();

  server.close(() => {
    outboxWorkerStopped.finally(() => pool.end().finally(() => process.exit(0)));
  });

  // Failsafe: force-exit if connections refuse to drain. unref() so this timer
  // never keeps the process alive on its own.
  setTimeout(() => process.exit(1), 10_000).unref();
};

/**
 * Last-resort handlers. Node prints an uncaught throw to stderr and exits, which
 * lands outside the structured log entirely, so the record is written here first.
 *
 * `uncaughtException` exits: the process is in an unknown state and must not
 * keep serving. `unhandledRejection` does not, because a stray promise in a
 * request is not grounds for dropping every other in-flight request.
 */
process.on('uncaughtException', (error) => {
  logger.fatal({ err: error, event: 'process.uncaught_exception' }, 'uncaught exception');

  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error(
    { err: reason, event: 'process.unhandled_rejection' },
    'unhandled promise rejection'
  );
});

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
