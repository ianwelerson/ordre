export const PLAN_CODES = ['free:founding', 'paid:founding'] as const;
export type PlanCode = (typeof PLAN_CODES)[number];

/**
 * Billing tiers. Encoded as the prefix of a plan `code` (`<tier>:<variant>`,
 * e.g. `free:founding`). A new plan generation keeps the tier and bumps the
 * variant, so the tier is the stable way to ask "which free/paid plan is current".
 */
export const PLAN_TIERS = ['free', 'paid'] as const;
export type PlanTier = (typeof PLAN_TIERS)[number];

/** Derives a plan's tier from its `code` (the segment before the first `:`). */
export const getPlanTier = (code: PlanCode): PlanTier => code.split(':')[0] as PlanTier;

export const PLAN_STATUSES = ['active', 'legacy', 'closed'] as const;
export type PlanStatus = (typeof PLAN_STATUSES)[number];

export const PLAN_LIMITS = ['member', 'location'] as const;
export type PlanLimit = (typeof PLAN_LIMITS)[number];

export const SUBSCRIPTION_STATUSES = ['active', 'cancelled'] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];
