import { env } from '#env';

import { createDb, createPool } from '@ordre/db/connection';

// One shared connection pool for the whole process. Exported so the server
// entrypoint can drain it on shutdown (see graceful shutdown in index.ts).
export const pool = createPool(env.DATABASE_URL);
export const db = createDb(pool);
