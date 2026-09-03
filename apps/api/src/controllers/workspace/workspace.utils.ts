import { getDb } from '#/config/db-context.ts';
import type {
  PlanRow,
  WorkspaceInviteRow,
  WorkspaceLocationRow,
  WorkspaceMemberRow,
  WorkspaceRow,
  WorkspaceSubscriptionRow,
} from '#/types/db.ts';
import { getSlugRestriction } from '#/utils/slug-restrictions.ts';
import { and, desc, eq, type SQL } from 'drizzle-orm';

import type { PlanTier, WorkspaceMemberRole } from '@ordre/core/enums';
import { errorResponse, WORKSPACE_ERRORS } from '@ordre/core/errors';
import { scopeRelations } from '@ordre/core/permissions';
import type {
  Plan,
  Response,
  Workspace,
  WorkspaceSubscriptionRead,
  WorkspaceSummary,
} from '@ordre/core/types';
import * as schema from '@ordre/db/schemas';

import { toInviteResponse } from './invite.utils.ts';
import { toLocationResponse } from './location.utils.ts';
import { toMemberResponse } from './member.utils.ts';

/** A subscription row joined with its plan, as loaded by the `subscription` relation. */
type SubscriptionWithPlanRow = WorkspaceSubscriptionRow & { plan: PlanRow };

/**
 * A fetched workspace plus any relations. Relations are optional because
 * `scopeRelations` drops the ones the caller's role can't see at runtime - the
 * type must not claim they're always present (Drizzle infers them as required).
 */
type WorkspaceWithRelations = WorkspaceRow &
  Partial<{
    members: WorkspaceMemberRow[];
    locations: WorkspaceLocationRow[];
    invites: WorkspaceInviteRow[];
    // `subscription` is a `many` relation filtered to the single active row, so
    // Drizzle returns it as an array (empty when there is no active subscription).
    subscription: SubscriptionWithPlanRow[];
  }>;

/**
 * Relations a workspace read requests, before role-gating. `scopeRelations`
 * drops any the caller's role isn't permitted to see, so every read that goes
 * through `findWorkspace` returns the same role-shaped set.
 */
const WORKSPACE_READ_RELATIONS = {
  members: true,
  locations: true,
  invites: true,
  // Only the active subscription, with its plan. Modeled `many` in the schema
  // (a workspace keeps historical rows), so we filter + `limit: 1` and unwrap
  // to a single object in `toWorkspaceResponse`.
  subscription: {
    where: eq(schema.workspaceSubscription.status, 'active'),
    limit: 1,
    with: { plan: true },
  },
} as const;

/**
 * Fetches a single workspace by an arbitrary condition, with role-scoped
 * relations. The relations present in the result depend on `role` (see
 * `scopeRelations`), which is why they're typed optional here.
 *
 * @param role - The caller's workspace role, used to gate which relations load.
 * @param where - The Drizzle condition selecting the workspace (e.g. by id or slug).
 * @returns The workspace with its permitted relations, or `undefined` if none matches.
 */
export const findWorkspace = (
  role: WorkspaceMemberRole,
  where: SQL
): Promise<WorkspaceWithRelations | undefined> =>
  // `scopeRelations` returns a `Partial` of the requested relations, which is why
  // the result shape is hand-maintained as `WorkspaceWithRelations` rather than
  // inferred: Drizzle can't statically see that `subscription` always loads its
  // `plan` (it does - we always pass `with: { plan: true }`), so we assert the
  // curated shape here.
  getDb().query.workspace.findFirst({
    where,
    with: scopeRelations(role, WORKSPACE_READ_RELATIONS),
  }) as Promise<WorkspaceWithRelations | undefined>;

/**
 * Finds the currently active plan for a billing tier - e.g. the free plan a new
 * workspace is subscribed to on creation. The tier is the `code` prefix
 * (`<tier>:<variant>`), and the `plan_one_active_per_tier` partial unique index
 * guarantees at most one active plan per tier, so `findFirst` is deterministic.
 *
 * @param tier - The billing tier to resolve (e.g. `'free'`).
 * @returns The active plan row for the tier, or `undefined` if none is active.
 */
export const findActivePlan = (tier: PlanTier): Promise<PlanRow | undefined> =>
  getDb().query.plan.findFirst({
    where: and(eq(schema.plan.status, 'active'), eq(schema.plan.tier, tier)),
  });

/**
 * Lists the workspaces a user is an active member of, as a minimal projection
 * (no relations, no timestamps) for a workspace switcher / "my workspaces" list.
 * Joins through membership and filters to `active`, so suspended memberships are
 * excluded. Newest workspace first.
 *
 * The selected columns already match {@link WorkspaceSummary} exactly and need no
 * date/shape transform, so there's no separate `toResponse` mapper here.
 *
 * @param userId - The user whose workspaces to list.
 * @returns The user's active workspaces as summaries.
 */
export const findUserWorkspaces = (userId: string): Promise<WorkspaceSummary[]> =>
  getDb()
    .select({
      id: schema.workspace.id,
      slug: schema.workspace.slug,
      name: schema.workspace.name,
      logo: schema.workspace.logo,
      type: schema.workspace.type,
      industry: schema.workspace.industry,
    })
    .from(schema.workspaceMember)
    .innerJoin(schema.workspace, eq(schema.workspace.id, schema.workspaceMember.workspaceId))
    .where(
      and(eq(schema.workspaceMember.userId, userId), eq(schema.workspaceMember.status, 'active'))
    )
    .orderBy(desc(schema.workspace.createdAt));

/**
 * Checks that a slug is both allowed (not reserved/protected/banned) and free.
 * Shared by create and update so both apply the identical rule. The duplicate
 * pre-check is best-effort - the unique index on `slug` is the real guard - so
 * callers still map a unique violation to `WORKSPACE_SLUG_ALREADY_EXISTS`.
 *
 * @param slug - The normalized candidate slug.
 * @param excludeId - A workspace id to ignore when checking for a duplicate (the
 *   one being updated), so a workspace keeping its own slug isn't a collision.
 * @returns An error `Response` to return as-is, or `null` when the slug is available.
 */
export const checkSlugAvailability = async (
  slug: string,
  excludeId?: string
): Promise<Response<never> | null> => {
  const restricted = getSlugRestriction(slug);

  if (restricted) {
    return errorResponse(WORKSPACE_ERRORS, restricted);
  }

  const existing = await getDb().query.workspace.findFirst({
    where: eq(schema.workspace.slug, slug),
  });

  if (existing && existing.id !== excludeId) {
    return errorResponse(WORKSPACE_ERRORS, 'WORKSPACE_SLUG_ALREADY_EXISTS');
  }

  return null;
};

/** Maps a plan row to its public response shape. */
const toPlanResponse = (plan: PlanRow): Plan => ({
  id: plan.id,
  code: plan.code,
  tier: plan.tier,
  status: plan.status,
  title: plan.title,
  description: plan.description,
  entitlements: plan.entitlements,
  createdAt: plan.createdAt.toISOString(),
  updatedAt: plan.updatedAt.toISOString(),
});

/** Maps a subscription row (joined with its plan) to its public response shape. */
const toSubscriptionResponse = (
  subscription: SubscriptionWithPlanRow
): WorkspaceSubscriptionRead => ({
  id: subscription.id,
  workspaceId: subscription.workspaceId,
  planId: subscription.planId,
  status: subscription.status,
  currentPeriodStart: subscription.currentPeriodStart?.toISOString() ?? null,
  currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
  cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
  createdAt: subscription.createdAt.toISOString(),
  updatedAt: subscription.updatedAt.toISOString(),
  plan: toPlanResponse(subscription.plan),
});

/**
 * Maps a workspace row (plus any scoped relations) to the API response body.
 * Relations are mapped to their public response shapes and only included when
 * present - i.e. when the caller's role was permitted to load them.
 *
 * @param workspace - The fetched workspace row, optionally carrying relations.
 * @returns The `Workspace` response body.
 */
export const toWorkspaceResponse = (workspace: WorkspaceWithRelations): Workspace => ({
  id: workspace.id,
  name: workspace.name,
  slug: workspace.slug,
  description: workspace.description,
  logo: workspace.logo,
  type: workspace.type,
  industry: workspace.industry,
  billingEmail: workspace.billingEmail,
  createdAt: workspace.createdAt.toISOString(),
  updatedAt: workspace.updatedAt.toISOString(),
  ...(workspace.members && { members: workspace.members.map(toMemberResponse) }),
  ...(workspace.locations && { locations: workspace.locations.map(toLocationResponse) }),
  ...(workspace.invites && { invites: workspace.invites.map(toInviteResponse) }),
  // `subscription` is a filtered `many` relation - unwrap the single active row.
  // Present only when the role could read it AND an active subscription exists.
  ...(workspace.subscription?.[0] && {
    subscription: toSubscriptionResponse(workspace.subscription[0]),
  }),
});

/**
 * Builds the standard 200 response for a single workspace (with role-scoped
 * relations), or `WORKSPACE_NOT_FOUND`. Shared by the read controllers and update so every
 * path returns an identical shape.
 *
 * @param role - The caller's workspace role, used to gate relations.
 * @param where - The Drizzle condition selecting the workspace.
 * @returns The `Workspace` (200) response, or `WORKSPACE_NOT_FOUND` (404).
 */
export const respondWithWorkspace = async (
  role: WorkspaceMemberRole,
  where: SQL
): Promise<Response<Workspace>> => {
  const workspace = await findWorkspace(role, where);

  if (!workspace) {
    return errorResponse(WORKSPACE_ERRORS, 'WORKSPACE_NOT_FOUND');
  }

  return { status: 200, body: toWorkspaceResponse(workspace) };
};
