import { env } from '#env';

import { createDb, createPool } from '@ordre/db/connection';

/**
 * Owner-privileged database connection for TEST INFRASTRUCTURE ONLY - running
 * migrations, `TRUNCATE`-ing between tests, and seeding fixtures. Those are owner
 * operations the restricted runtime role (`ordre_app`, used by `#/config/db.ts`)
 * can't and shouldn't do.
 *
 * The app under test still connects as `ordre_app`, so tests exercise the same
 * RLS-enforced role as production. Seeding via the owner also bypasses RLS, so
 * fixtures keep inserting cleanly once policies exist.
 */
export const ownerPool = createPool(env.DATABASE_OWNER_URL);
export const ownerDb = createDb(ownerPool);
