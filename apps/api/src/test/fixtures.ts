import type * as schema from '@ordre/db/schemas';

type UserInsert = typeof schema.user.$inferInsert;
type WorkspaceInsert = typeof schema.workspace.$inferInsert;
type WorkspaceMemberInsert = typeof schema.workspaceMember.$inferInsert;
type WorkspaceLocationInsert = typeof schema.workspaceLocation.$inferInsert;
type WorkspaceMemberInviteInsert = typeof schema.workspaceInvite.$inferInsert;
type PlanInsert = typeof schema.plan.$inferInsert;
type WorkspaceSubscriptionInsert = typeof schema.workspaceSubscription.$inferInsert;

/**
 * Stable UUIDs for seeded rows.
 *
 * Fixed (not random) so tests can reference a known id directly - e.g. asserting
 * `GET /workspace/:id` returns a workspace, or that an unrelated id 404s. Keep
 * `missing` ids OUT of the seed so "not found" cases stay reliably absent.
 */

export const USER_IDS = {
  // Members of the primary workspace, one per role.
  owner: 'dd2d6688-63d2-4775-a44a-b844fa42a29d',
  admin: '3f1c0a52-6b7d-4e8f-9a10-2c3d4e5f6a7b',
  member: '9b8a7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d',
  // A member of the primary workspace whose membership is `suspended` - exercises
  // the 403 in `requireWorkspaceAccess` (a member row exists, but it's not active).
  suspended: '6d5c4b3a-2f1e-4d0c-9b8a-7f6e5d4c3b2a',
  // A real user that belongs to NO workspace - exercises the membership 404s
  // in `requireWorkspaceAccess` (authenticated but not a member).
  outsider: 'a1b2c3d4-e5f6-4708-9a1b-2c3d4e5f6071',
  // Never seeded - for "unknown user" cases.
  missing: '00000000-0000-4000-8000-000000000000',
} as const;

export const WORKSPACE_IDS = {
  primary: '7fc754a0-b688-41ee-a58b-cf405c90b82b',
  minimal: '2b6d1f2a-4c3e-4a1d-9f0b-8e7c6d5a4b3c',
  missing: 'c410d83e-3d82-465c-8bcf-a9abd5cb1c7c',
} as const;

export const LOCATION_IDS = {
  // The primary workspace's default location, plus one non-default - so location
  // route tests can exercise the default guard (can't delete the default) and the
  // set-default swap against known ids.
  primaryDefault: 'b0c1d2e3-f405-4617-8829-a0b1c2d3e4f5',
  primarySecondary: 'c1d2e3f4-0516-4728-9a3b-b1c2d3e4f506',
  // Never seeded - for "unknown location" cases.
  missing: 'd2e3f405-1627-4839-8a4b-c2d3e4f50617',
} as const;

/**
 * Membership row ids, one per seeded `workspaceMemberFixtures` entry. Fixed so
 * member route tests can target a known member (read, update, remove, change
 * role) by id. Distinct from `USER_IDS` - a membership id is not its user id.
 */
export const MEMBER_IDS = {
  owner: 'a1000000-0000-4000-8000-000000000001',
  admin: 'a2000000-0000-4000-8000-000000000002',
  member: 'a3000000-0000-4000-8000-000000000003',
  ownerMinimal: 'a4000000-0000-4000-8000-000000000004',
  suspended: 'a5000000-0000-4000-8000-000000000005',
  // Never seeded - for "unknown member" cases.
  missing: 'a9000000-0000-4000-8000-000000000009',
} as const;

/**
 * Invite ids/tokens for the primary workspace, covering each status the invite
 * routes branch on. `missing` stays OUT of the seed for "not found" cases.
 */
export const INVITE_IDS = {
  pending: 'b1000000-0000-4000-8000-000000000001',
  pendingForOutsider: 'b2000000-0000-4000-8000-000000000002',
  expired: 'b3000000-0000-4000-8000-000000000003',
  accepted: 'b4000000-0000-4000-8000-000000000004',
  missing: 'b9000000-0000-4000-8000-000000000009',
} as const;

export const INVITE_TOKENS = {
  pending: 'tok_pending_invite',
  pendingForOutsider: 'tok_outsider_invite',
  expired: 'tok_expired_invite',
  accepted: 'tok_accepted_invite',
  missing: 'tok_missing_invite',
} as const;

export const PLAN_IDS = {
  free: 'e1a2b3c4-d5e6-4f70-8a1b-2c3d4e5f6071',
  paid: 'f1a2b3c4-d5e6-4f70-8a1b-2c3d4e5f6072',
} as const;

/** Users inserted by `seedDb()`. Members reference these ids (FK -> `user.id`). */
export const userFixtures = [
  {
    id: USER_IDS.owner,
    name: 'Owner User',
    email: 'owner@ordre.app',
    emailVerified: true,
  },
  {
    id: USER_IDS.admin,
    name: 'Admin User',
    email: 'admin@ordre.app',
    emailVerified: true,
  },
  {
    id: USER_IDS.member,
    name: 'Member User',
    email: 'member@ordre.app',
    emailVerified: true,
  },
  {
    id: USER_IDS.suspended,
    name: 'Suspended User',
    email: 'suspended@ordre.app',
    emailVerified: true,
  },
  {
    id: USER_IDS.outsider,
    name: 'Outsider User',
    email: 'outsider@ordre.app',
    emailVerified: true,
  },
] satisfies UserInsert[];

/** Workspaces inserted by `seedDb()` before each integration test. */
export const workspaceFixtures = [
  {
    id: WORKSPACE_IDS.primary,
    slug: 'test-workspace',
    name: 'Test Workspace',
    description: 'Seeded workspace used across integration tests',
    type: 'individual',
    industry: 'other',
  },
  // Only the required fields set, so the optional columns (`description`, `logo`,
  // `billingEmail`) are NULL - exercises the `?? undefined` mapping in the controller.
  {
    id: WORKSPACE_IDS.minimal,
    slug: 'minimal-workspace',
    name: 'Minimal Workspace',
    type: 'individual',
    industry: 'other',
  },
] satisfies WorkspaceInsert[];

/**
 * Membership rows linking `userFixtures` to `workspaceFixtures` (FK -> both
 * `user.id` and `workspace.id`). `requireWorkspaceAccess` resolves the caller's
 * row from these, and `requireWorkspacePermission` reads the `role` - so seeding
 * one member per role lets tests exercise the RBAC guards by mocking the session
 * as the matching `USER_IDS.*`.
 *
 * The `owner` also owns `minimal` so both seeded workspaces are reachable; the
 * `outsider` is intentionally absent so authenticated-but-not-a-member 404s hold.
 * The `suspended` row is a `member` whose status isn't `active`, so the 403 in
 * `requireWorkspaceAccess` has a caller to reject.
 */
export const workspaceMemberFixtures = [
  {
    id: MEMBER_IDS.owner,
    userId: USER_IDS.owner,
    workspaceId: WORKSPACE_IDS.primary,
    role: 'owner',
    status: 'active',
  },
  {
    id: MEMBER_IDS.admin,
    userId: USER_IDS.admin,
    workspaceId: WORKSPACE_IDS.primary,
    role: 'admin',
    status: 'active',
  },
  {
    id: MEMBER_IDS.member,
    userId: USER_IDS.member,
    workspaceId: WORKSPACE_IDS.primary,
    role: 'member',
    status: 'active',
  },
  {
    id: MEMBER_IDS.ownerMinimal,
    userId: USER_IDS.owner,
    workspaceId: WORKSPACE_IDS.minimal,
    role: 'owner',
    status: 'active',
  },
  {
    id: MEMBER_IDS.suspended,
    userId: USER_IDS.suspended,
    workspaceId: WORKSPACE_IDS.primary,
    role: 'member',
    status: 'suspended',
  },
] satisfies WorkspaceMemberInsert[];

/**
 * Locations for the primary workspace: one default and one non-default. The
 * seed inserts these directly (unlike `workspaceCreate`, which makes a default
 * automatically), so location route tests have known ids to read, update,
 * promote, and delete. `minimal` is left without any so the empty-list case
 * stays covered.
 */
export const workspaceLocationFixtures = [
  {
    id: LOCATION_IDS.primaryDefault,
    workspaceId: WORKSPACE_IDS.primary,
    name: 'Headquarters',
    isDefault: true,
  },
  {
    id: LOCATION_IDS.primarySecondary,
    workspaceId: WORKSPACE_IDS.primary,
    name: 'Branch',
    isDefault: false,
  },
] satisfies WorkspaceLocationInsert[];

// Relative expiries so the pending invites are reliably live and the expired one
// is reliably stale, regardless of when the suite runs.
const INVITE_FUTURE = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
const INVITE_PAST = new Date(Date.now() - 24 * 60 * 60 * 1000);

/**
 * Invites for the primary workspace, one per status the routes branch on:
 * - `pending`   : live, admin-managable, previewable, declinable.
 * - `pendingForOutsider` : live, addressed to the seeded outsider so the accept
 *   flow can match the caller's email and create a membership.
 * - `expired`   : still `pending` but past `expiresAt`, so preview/accept 404.
 * - `accepted`  : history - listed by the admin, but not deletable (not pending).
 * All are sent by the primary workspace's owner.
 */
export const workspaceInviteFixtures = [
  {
    id: INVITE_IDS.pending,
    email: 'pending-invitee@ordre.app',
    name: 'Pending Invitee',
    role: 'member',
    workspaceId: WORKSPACE_IDS.primary,
    invitedByMemberId: MEMBER_IDS.owner,
    token: INVITE_TOKENS.pending,
    status: 'pending',
    expiresAt: INVITE_FUTURE,
  },
  {
    id: INVITE_IDS.pendingForOutsider,
    email: 'outsider@ordre.app',
    name: 'Outsider User',
    role: 'member',
    workspaceId: WORKSPACE_IDS.primary,
    invitedByMemberId: MEMBER_IDS.owner,
    token: INVITE_TOKENS.pendingForOutsider,
    status: 'pending',
    expiresAt: INVITE_FUTURE,
  },
  {
    id: INVITE_IDS.expired,
    email: 'expired-invitee@ordre.app',
    name: 'Expired Invitee',
    role: 'member',
    workspaceId: WORKSPACE_IDS.primary,
    invitedByMemberId: MEMBER_IDS.owner,
    token: INVITE_TOKENS.expired,
    status: 'pending',
    expiresAt: INVITE_PAST,
  },
  {
    id: INVITE_IDS.accepted,
    email: 'accepted-invitee@ordre.app',
    name: 'Accepted Invitee',
    role: 'member',
    workspaceId: WORKSPACE_IDS.primary,
    invitedByMemberId: MEMBER_IDS.owner,
    token: INVITE_TOKENS.accepted,
    status: 'accepted',
    expiresAt: INVITE_FUTURE,
  },
] satisfies WorkspaceMemberInviteInsert[];

/**
 * The plan catalog seeded before each integration test. Mirrors the real seed
 * (`packages/db/src/seeds/plan.ts`): one `active` plan per tier, so
 * `findActivePlan('free')` resolves during workspace creation.
 */
export const planFixtures = [
  {
    id: PLAN_IDS.free,
    code: 'free:founding',
    tier: 'free',
    status: 'active',
    title: 'Free',
    description: 'Get started with a single location and member.',
    entitlements: { limits: { member: 1, location: 1 } },
  },
  {
    id: PLAN_IDS.paid,
    code: 'paid:founding',
    tier: 'paid',
    status: 'active',
    title: 'Founding',
    description: 'Unlimited members and locations.',
    entitlements: { limits: { member: 3, location: 1 } },
  },
] satisfies PlanInsert[];

/**
 * Subscriptions inserted by `seedDb()`. The primary workspace is on the free
 * plan so reads exercise the embedded-subscription path; `minimal` is left
 * without one so the "no active subscription -> omitted" case stays covered.
 */
export const workspaceSubscriptionFixtures = [
  {
    workspaceId: WORKSPACE_IDS.primary,
    planId: PLAN_IDS.free,
    status: 'active',
  },
] satisfies WorkspaceSubscriptionInsert[];
