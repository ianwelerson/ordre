import { clearFeatureCache } from '#/services/feature.ts';
import { isTest } from '#env';
import { eq } from 'drizzle-orm';

import type { Feature } from '@ordre/core/enums';
import type { PlanEntitlements } from '@ordre/core/types';
import * as schema from '@ordre/db/schemas';

import {
  featureFixtures,
  PLAN_IDS,
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
  // Catalog data with no foreign keys, so order does not matter here.
  await ownerDb.insert(schema.feature).values(featureFixtures);

  // The resolved switches are cached in the worker process and outlive the
  // TRUNCATE above, so without this a test reads the previous test's answer.
  clearFeatureCache();
};

/**
 * Tightens the free plan's limits for a single test.
 *
 * The seeded plans are uncapped so route tests aren't gated by
 * `requireWorkspaceQuota` (see `planFixtures`); a test that wants to exercise a
 * quota narrows the cap first. The primary workspace is subscribed to the free
 * plan, and `resetDb()` + `seedDb()` restore the catalog before the next test.
 *
 * @param limits - The `entitlements.limits` to apply to the free plan.
 */
export const setFreePlanLimits = async (limits: PlanEntitlements['limits']) => {
  assertTestDb();

  await ownerDb
    .update(schema.plan)
    .set({ entitlements: { limits } })
    .where(eq(schema.plan.id, PLAN_IDS.free));
};

/**
 * Turns one feature switch on or off for a single test.
 *
 * The fixtures seed every switch on (see `featureFixtures`), so a test that wants
 * a closed surface closes it here. `resetDb()` + `seedDb()` reopen them all
 * before the next test.
 *
 * @param key - The feature to change.
 * @param enabled - What to set it to.
 */
export const setFeature = async (key: Feature, enabled: boolean) => {
  assertTestDb();

  await ownerDb.update(schema.feature).set({ enabled }).where(eq(schema.feature.key, key));

  clearFeatureCache();
};
