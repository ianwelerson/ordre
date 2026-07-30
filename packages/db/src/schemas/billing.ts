import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { PLAN_CODES, PLAN_STATUSES, PLAN_TIERS, SUBSCRIPTION_STATUSES } from '@ordre/core/enums';
import type { PlanEntitlements } from '@ordre/core/types';

import { workspace } from './workspace.ts';

export const planCode = pgEnum('plan_code', PLAN_CODES);
export const planTier = pgEnum('plan_tier', PLAN_TIERS);
export const planStatus = pgEnum('plan_status', PLAN_STATUSES);
export const subscriptionStatus = pgEnum('subscription_status', SUBSCRIPTION_STATUSES);

export const plan = pgTable(
  'plan',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    code: planCode('code').notNull().unique(),
    // The billing tier, derivable from `code` (`getPlanTier`) but stored so it
    // can back the "one active per tier" index below - an index expression over
    // `code::text` isn't allowed (the enum cast isn't IMMUTABLE).
    tier: planTier('tier').notNull(),
    status: planStatus('status').notNull(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    entitlements: jsonb('entitlements').$type<PlanEntitlements>().notNull().default({ limits: {} }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    // At most one `active` plan per tier. Makes "the current free/paid plan" a
    // single, well-defined row - only constrains `status = 'active'` rows, so
    // legacy/closed plans of a tier can coexist.
    uniqueIndex('plan_one_active_per_tier')
      .on(t.tier)
      .where(sql`${t.status} = 'active'`),
  ]
);

export const workspaceSubscription = pgTable(
  'workspace_subscription',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspace.id, { onDelete: 'cascade' }),
    planId: uuid('plan_id')
      .notNull()
      .references(() => plan.id, { onDelete: 'restrict' }),
    status: subscriptionStatus('status').notNull().default('active'),
    currentPeriodStart: timestamp('current_period_start', { withTimezone: true }),
    currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
    cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    uniqueIndex('workspace_subscription_one_active_per_workspace')
      .on(t.workspaceId)
      .where(sql`${t.status} = 'active'`),
  ]
);

// ---- Relations ----

export const workspaceSubscriptionRelations = relations(workspaceSubscription, ({ one }) => ({
  workspace: one(workspace, {
    fields: [workspaceSubscription.workspaceId],
    references: [workspace.id],
  }),
  plan: one(plan, {
    fields: [workspaceSubscription.planId],
    references: [plan.id],
  }),
}));

export const planRelations = relations(plan, ({ many }) => ({
  subscriptions: many(workspaceSubscription),
}));
