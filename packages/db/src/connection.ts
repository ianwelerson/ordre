import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import * as schema from './schemas/index.ts';

export const createPool = (dbUrl: string) => new Pool({ connectionString: dbUrl });
export const createDb = (pool: Pool) => drizzle({ client: pool, schema });
