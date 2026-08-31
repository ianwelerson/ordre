import { env } from '#env';

import { createDb, createPool } from '@ordre/db/connection';

import { logger } from './logger.ts';

// One shared connection pool for the whole process. Exported so the server
// entrypoint can drain it on shutdown (see graceful shutdown in index.ts).
export const pool = createPool(env.DATABASE_URL);

/**
 * `pg` emits this on an idle client whose connection the server dropped - a
 * database restart or failover. `Pool` is an `EventEmitter`, so without a
 * listener the event throws and takes the process with it unexplained. The
 * client is already removed from the pool by the time this runs; there is
 * nothing to do but record it.
 */
pool.on('error', (error) => {
  logger.error({ err: error, event: 'db.pool_error' }, 'idle database client errored');
});

export const db = createDb(pool);
