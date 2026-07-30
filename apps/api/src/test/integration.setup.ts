import { beforeEach } from 'vitest';

import { resetDb, seedDb } from './db.ts';

// Runs in each test worker before every integration test, so each one starts from
// identical, known data with fixed UUIDs (see `fixtures.ts`) regardless of what
// previous tests inserted or mutated.
beforeEach(async () => {
  await resetDb();
  await seedDb();
});
