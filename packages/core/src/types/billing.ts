import { z } from 'zod';

import {
  PlanEntitlementsSchema,
  PlanSchema,
  WorkspaceSubscriptionReadSchema,
  WorkspaceSubscriptionSchema,
} from '../schemas/billing.ts';

export type PlanEntitlements = z.infer<typeof PlanEntitlementsSchema>;
export type Plan = z.infer<typeof PlanSchema>;

export type WorkspaceSubscription = z.infer<typeof WorkspaceSubscriptionSchema>;

/** A workspace's active subscription joined with its plan, as embedded in a workspace read. */
export type WorkspaceSubscriptionRead = z.infer<typeof WorkspaceSubscriptionReadSchema>;
