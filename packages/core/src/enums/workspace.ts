/**
 * Canonical value lists for the workspace domain.
 *
 * This is the single source of truth shared across the stack: `@ordre/db` turns
 * each list into a Postgres enum type via `pgEnum`, while API validation and the
 * UI import the same arrays/types. Keeping the values here (and NOT in the db
 * package) avoids a dependency from `@ordre/core` onto `@ordre/db`.
 *
 * Each list is declared `as const` so it is typed as a readonly tuple rather than
 * `string[]`. Both `pgEnum` and the derived union types below require that tuple
 * shape.
 */

export const WORKSPACE_TYPES = ['individual', 'business'] as const;
export type WorkspaceType = (typeof WORKSPACE_TYPES)[number];

export const WORKSPACE_INDUSTRIES = [
  'jewelry',
  'personal',
  'technology',
  'automotive',
  'construction',
  'other',
] as const;
export type WorkspaceIndustry = (typeof WORKSPACE_INDUSTRIES)[number];

export const WORKSPACE_MEMBER_ROLES = ['owner', 'admin', 'member'] as const;
export type WorkspaceMemberRole = (typeof WORKSPACE_MEMBER_ROLES)[number];

export const WORKSPACE_MEMBER_STATUSES = ['active', 'suspended'] as const;
export type WorkspaceMemberStatus = (typeof WORKSPACE_MEMBER_STATUSES)[number];

export const WORKSPACE_INVITE_STATUSES = [
  'pending',
  'accepted',
  'declined',
  'expired',
  'revoked',
] as const;
export type WorkspaceInviteStatus = (typeof WORKSPACE_INVITE_STATUSES)[number];

/**
 * Workspace relations that can be gated by permission when shaping a read (see
 * `WORKSPACE_RELATION_PERMISSIONS` / `scopeRelations`). Only lists the workspace
 * table's own exposable relations - backrefs and join-table relations are named
 * with plain literals in the schema, since their names are table-specific.
 */
export const WORKSPACE_RELATION = {
  MEMBERS: 'members',
  LOCATIONS: 'locations',
  INVITES: 'invites',
  SUBSCRIPTION: 'subscription',
} as const;

export type WorkspaceRelation = (typeof WORKSPACE_RELATION)[keyof typeof WORKSPACE_RELATION];
