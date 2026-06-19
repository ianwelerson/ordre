import { pool } from '#/config/db.ts';
import { logger } from '#/config/logger.ts';
import { env } from '#env';

import { app } from './server.ts';

const server = app.listen(env.PORT, () => {
  logger.info(`Server running on port ${env.PORT}`);
});

/**
 * Graceful shutdown: stop accepting new requests, let in-flight ones finish, then drain the DB pool.
 *
 * */
const shutdown = (signal: string) => {
  logger.info(`${signal} received, shutting down`);

  server.close(() => {
    pool.end().finally(() => process.exit(0));
  });

  // Failsafe: force-exit if connections refuse to drain. unref() so this timer
  // never keeps the process alive on its own.
  setTimeout(() => process.exit(1), 10_000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
