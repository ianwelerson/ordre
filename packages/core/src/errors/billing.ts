import type { ErrorMap } from '../types/index.ts';

export const BILLING_ERRORS = {
  NO_ACTIVE_PLAN: {
    status: 500,
    message: "We couldn't find an active plan for this workspace. Please contact support",
  },
  INVALID_PLAN_ENTITLEMENTS: {
    status: 500,
    message: "We couldn't read the limits on your plan. Please contact support",
  },
  LOCATION_LIMIT_REACHED: {
    status: 403,
    message: "You've reached the maximum number of locations allowed on your plan",
  },
  SEAT_LIMIT_REACHED: {
    status: 403,
    message: "You've used every seat on your plan. Pending invites count as seats",
  },
} satisfies ErrorMap;
