import { getDb } from '#/config/db-context.ts';
import { logger } from '#/config/logger.ts';
import { and, count, eq } from 'drizzle-orm';
import type { NextFunction, Request, Response } from 'express';

import type { PlanLimit } from '@ordre/core/enums';
import { BILLING_ERRORS, errorResponse } from '@ordre/core/errors';
import { PlanEntitlementsSchema } from '@ordre/core/schemas';
import * as schemas from '@ordre/db/schemas';

/**
 * Counts the workspace's locations.
 *
 * @param workspaceId - The workspace to count within.
 * @returns How many locations the workspace holds.
 */
const countLocations = async (workspaceId: string) => {
  const [row] = await getDb()
    .select({ total: count() })
    .from(schemas.workspaceLocation)
    .where(eq(schemas.workspaceLocation.workspaceId, workspaceId));

  return row?.total ?? 0;
};

/**
 * Counts the workspace's occupied seats: active members plus pending invites.
 *
 * A pending invite is a seat already spent - accepting it swaps the invite row
 * for a member row, so the total is unchanged and an accepted invite can never
 * push a workspace over its cap. The owner occupies a seat like anyone else.
 *
 * @param workspaceId - The workspace to count within.
 * @returns How many seats the workspace has in use.
 */
const countSeats = async (workspaceId: string) => {
  const [members] = await getDb()
    .select({ total: count() })
    .from(schemas.workspaceMember)
    .where(
      and(
        eq(schemas.workspaceMember.workspaceId, workspaceId),
        eq(schemas.workspaceMember.status, 'active')
      )
    );

  const [invites] = await getDb()
    .select({ total: count() })
    .from(schemas.workspaceInvite)
    .where(
      and(
        eq(schemas.workspaceInvite.workspaceId, workspaceId),
        eq(schemas.workspaceInvite.status, 'pending')
      )
    );

  return (members?.total ?? 0) + (invites?.total ?? 0);
};

/**
 * The counter that measures current usage for each plan limit. `satisfies` keeps
 * the map exhaustive, so adding a `PlanLimit` is a compile error until it has a
 * counter here rather than a silently unenforced quota.
 */
const USAGE = {
  location: countLocations,
  seat: countSeats,
} satisfies Record<PlanLimit, (workspaceId: string) => Promise<number>>;

/** The error each limit reports once the workspace has no room left. */
const LIMIT_REACHED = {
  location: 'PLAN_LOCATION_LIMIT_REACHED',
  seat: 'PLAN_SEAT_LIMIT_REACHED',
} satisfies Record<PlanLimit, keyof typeof BILLING_ERRORS>;

/**
 * Middleware factory that gates a route on the workspace's plan quota - the
 * billing-level check, for routes that consume a unit of a metered resource.
 *
 * Must run after `requireWorkspaceAccess`, which populates `req.workspace`, and
 * after `requireWorkspacePermission`, so a caller who isn't allowed to perform
 * the action never learns the plan is at its cap. A missing `req.workspace` means
 * the guard wasn't mounted in that order - that's a misconfiguration, so it
 * throws (surfacing as a 500) rather than masking the wiring bug as a 402.
 *
 * A plan that doesn't cap the limit passes through without a count query, while
 * a plan whose entitlements don't validate is rejected rather than treated as
 * uncapped. The check is read-then-act with no lock, so concurrent requests can
 * both see room and overshoot the cap by the request concurrency; the overshoot
 * is bounded and self-corrects, since the next request sees the true count.
 *
 * @param limit - Which plan limit the route consumes one unit of.
 * @returns An Express middleware that enforces the workspace's quota for `limit`.
 */
export const requireWorkspaceQuota =
  (limit: PlanLimit) => async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.workspace) {
        throw new Error(
          'requireWorkspaceQuota: req.workspace is missing (mount requireWorkspaceAccess first)'
        );
      }

      const { id: workspaceId } = req.workspace;

      const subscription = await getDb().query.workspaceSubscription.findFirst({
        where: and(
          eq(schemas.workspaceSubscription.workspaceId, workspaceId),
          eq(schemas.workspaceSubscription.status, 'active')
        ),
        with: { plan: true },
      });

      if (!subscription?.plan) {
        const { status, body } = errorResponse(BILLING_ERRORS, 'PLAN_MISSING');

        return res.status(status).json(body);
      }

      // `entitlements` is a JSONB blob that Drizzle types but never validates. A
      // typo'd limit key would read as absent, and an absent key means unlimited -
      // so a malformed plan is refused rather than silently uncapping a workspace.
      const entitlements = PlanEntitlementsSchema.safeParse(subscription.plan.entitlements);

      if (!entitlements.success) {
        logger.error(
          { planId: subscription.plan.id, issues: entitlements.error.issues },
          'Plan entitlements failed validation'
        );

        const { status, body } = errorResponse(BILLING_ERRORS, 'PLAN_ENTITLEMENTS_INVALID');

        return res.status(status).json(body);
      }

      const max = entitlements.data.limits[limit];

      // `null` or a missing key documents "unlimited" (see `PlanLimitsSchema`).
      if (typeof max !== 'number') {
        return next();
      }

      if ((await USAGE[limit](workspaceId)) >= max) {
        const { status, body } = errorResponse(BILLING_ERRORS, LIMIT_REACHED[limit]);

        return res.status(status).json(body);
      }

      next();
    } catch (error) {
      return next(error);
    }
  };
