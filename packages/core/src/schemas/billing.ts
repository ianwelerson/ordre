import { z } from 'zod';

import {
  PLAN_CODES,
  PLAN_LIMITS,
  PLAN_STATUSES,
  PLAN_TIERS,
  SUBSCRIPTION_STATUSES,
} from '../enums/billing.ts';

/**
 * Quota values keyed by limit. A missing key (or null) means "unlimited".
 * Adding a new limit = add to PLAN_LIMITS enum, no DB migration.
 */
export const PlanLimitsSchema = z.partialRecord(
  z.enum(PLAN_LIMITS),
  z.number().int().nonnegative().nullable()
);

/**
 * A plan's entitlements. Kept as a small JSON blob rather than its own table for
 * now; add further entitlement groups (e.g. `features`) here as they're needed.
 */
export const PlanEntitlementsSchema = z.object({
  limits: PlanLimitsSchema,
});

/**
 * Plan Schema
 */
export const PlanSchema = z.object({
  id: z.uuid(),
  code: z.enum(PLAN_CODES),
  tier: z.enum(PLAN_TIERS),
  status: z.enum(PLAN_STATUSES),
  title: z.string(),
  description: z.string(),
  entitlements: PlanEntitlementsSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

/**
 * Workspace Subscription
 */
export const WorkspaceSubscriptionSchema = z.object({
  id: z.uuid(),
  workspaceId: z.uuid(),
  planId: z.uuid(),
  status: z.enum(SUBSCRIPTION_STATUSES),
  currentPeriodStart: z.iso.datetime().nullish(),
  currentPeriodEnd: z.iso.datetime().nullish(),
  cancelAtPeriodEnd: z.boolean(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

/**
 * A workspace's active subscription as embedded in a workspace read: the
 * subscription joined with its plan, so callers get the tier, entitlements and
 * status in one shape. Present only when the caller's role may read it (see
 * `scopeRelations`).
 */
export const WorkspaceSubscriptionReadSchema = WorkspaceSubscriptionSchema.extend({
  plan: PlanSchema,
});
