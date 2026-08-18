import type { ErrorMap } from '../types/index.ts';

/**
 * Errors for plans, subscriptions and the quotas they carry.
 *
 * The two 500s describe an inconsistent workspace (no active plan, or a plan
 * whose entitlements don't validate) - a data problem the caller can't fix, so
 * they point at support. The limit errors are 402, not 403: the block is the
 * plan's cap, not a permission decision, and the routes that enforce them can
 * also return a real 403 from `requireWorkspacePermission`.
 */
export const BILLING_ERRORS = {
  PLAN_MISSING: { status: 500 },
  PLAN_ENTITLEMENTS_INVALID: { status: 500 },
  PLAN_LOCATION_LIMIT_REACHED: { status: 402 },
  PLAN_SEAT_LIMIT_REACHED: { status: 402 },
} satisfies ErrorMap;
