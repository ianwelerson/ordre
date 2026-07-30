import { isTest } from '#env';

import * as schema from '@ordre/db/schemas';

import {
  planFixtures,
  userFixtures,
  workspaceFixtures,
  workspaceInviteFixtures,
  workspaceLocationFixtures,
  workspaceMemberFixtures,
  workspaceSubscriptionFixtures,
} from './fixtures.ts';
import { ownerDb, ownerPool } from './owner-db.ts';

// Guard against a misconfigured env ever pointing the truncate at a real DB.
const assertTestDb = () => {
  if (!isTest()) {
    throw new Error('Refusing to reset the database outside of APP_STAGE=test');
  }
};

/**
 * Empties every table in the `public` schema.
 *
 * Discovers tables at runtime (rather than hard-coding a list) so new schemas are
 * covered automatically. `CASCADE` clears FK-dependent rows and `RESTART IDENTITY`
 * resets sequences; drizzle's migration bookkeeping lives in the `drizzle` schema,
 * so it is left untouched.
 */
export const resetDb = async () => {
  assertTestDb();

  const { rows } = await ownerPool.query<{ tablename: string }>(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`
  );

  if (rows.length === 0) {
    return;
  }

  const tables = rows.map((row) => `"public"."${row.tablename}"`).join(', ');
  await ownerPool.query(`TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE`);
};

/**
 * Inserts the fixed-UUID fixtures every integration test can rely on.
 *
 * Order follows the FK graph: users and workspaces first, then the membership
 * rows that reference both. Plans are catalog data (no FK to the rows above), and
 * subscriptions come last since they reference both a workspace and a plan.
 */
export const seedDb = async () => {
  assertTestDb();

  await ownerDb.insert(schema.user).values(userFixtures);
  await ownerDb.insert(schema.workspace).values(workspaceFixtures);
  await ownerDb.insert(schema.workspaceMember).values(workspaceMemberFixtures);
  await ownerDb.insert(schema.workspaceLocation).values(workspaceLocationFixtures);
  // Invites reference the workspace and (nullably) a location + inviting member,
  // so they come after all three are seeded.
  await ownerDb.insert(schema.workspaceInvite).values(workspaceInviteFixtures);
  await ownerDb.insert(schema.plan).values(planFixtures);
  await ownerDb.insert(schema.workspaceSubscription).values(workspaceSubscriptionFixtures);
};
