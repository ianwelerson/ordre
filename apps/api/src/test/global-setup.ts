import { migrate } from '@ordre/db/migrate';

import { resetDb } from './db.ts';
import { ownerDb, ownerPool } from './owner-db.ts';

/**
 * Vitest global setup for the integration project - runs once, in the main
 * process, around the whole suite.
 *
 * Brings the test database up to the current schema (so a freshly created
 * `ordre-test` needs no manual `db:push`), starts from an empty state, and leaves
 * it clean on teardown. Per-test seeding lives in `integration.setup.ts`.
 */
export default async function setup() {
  await migrate(ownerDb);
  await resetDb();

  return async () => {
    await resetDb();
    await ownerPool.end();
  };
}
