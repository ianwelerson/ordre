import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import * as schema from './schemas/index.ts';

/** Opens a Postgres connection pool for the given database URL. */
export const createPool = (dbUrl: string) => new Pool({ connectionString: dbUrl });

/** Wraps a pool in a Drizzle client bound to the app schema. */
export const createDb = (pool: Pool) => drizzle({ client: pool, schema });

export type Db = ReturnType<typeof createDb>;
