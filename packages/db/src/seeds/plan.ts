import { getPlanTier } from '@ordre/core/enums';
import type { PlanEntitlements } from '@ordre/core/types';

import type { Db } from '../connection.ts';
import { plan } from '../schemas/billing.ts';

/**
 * The plan catalog. This is the single source of truth for the seeded tiers.
 *
 * Entitlement rules (see `PlanEntitlementsSchema`):
 *   - a limit set to a number caps that resource
 *   - a limit set to `null`, or omitted entirely, means "unlimited"
 *
 * There is no admin API for plans: seed once, and evolve the catalog with a
 * migration (or by re-running this idempotent seed).
 */
const PLAN_CATALOG: ReadonlyArray<{
  code: (typeof plan.$inferInsert)['code'];
  status: (typeof plan.$inferInsert)['status'];
  title: string;
  description: string;
  entitlements: PlanEntitlements;
}> = [
  {
    code: 'free:founding',
    // The current free tier - new workspaces are subscribed to whichever plan is
    // `active` in its tier (see the `plan_one_active_per_tier` index).
    status: 'active',
    title: 'Free',
    description: 'Run a single location with room for you and one teammate.',
    entitlements: {
      limits: { seat: 2, location: 1 },
    },
  },
  {
    code: 'paid:founding',
    status: 'active',
    title: 'Founding',
    description: 'Grow to 20 members across 3 locations.',
    entitlements: {
      limits: { seat: 20, location: 3 },
    },
  },
];

/**
 * Upserts the plan catalog. Idempotent - keyed on the unique `plan.code`, so
 * re-running refreshes titles/descriptions/entitlements without creating dupes
 * and without touching each plan's `id`.
 */
export const seedPlans = async (db: Db): Promise<void> => {
  for (const entry of PLAN_CATALOG) {
    // `tier` is derived from `code` (`getPlanTier`) rather than duplicated in the
    // catalog above, so the two can never drift.
    const values = { ...entry, tier: getPlanTier(entry.code) };

    await db
      .insert(plan)
      .values(values)
      .onConflictDoUpdate({
        target: plan.code,
        set: {
          tier: values.tier,
          status: entry.status,
          title: entry.title,
          description: entry.description,
          entitlements: entry.entitlements,
          updatedAt: new Date(),
        },
      });
  }
};
