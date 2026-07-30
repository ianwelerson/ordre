import { z } from 'zod';

import {
  WORKSPACE_INDUSTRIES,
  WORKSPACE_INVITE_STATUSES,
  WORKSPACE_MEMBER_ROLES,
  WORKSPACE_MEMBER_STATUSES,
  WORKSPACE_TYPES,
} from './../enums/index.ts';
import { WorkspaceSubscriptionReadSchema } from './billing.ts';

// The column is `numeric(_, 6)`, so anything finer is rounded on write rather
// than rejected here.
const LatitudeSchema = z.number().min(-90).max(90);
const LongitudeSchema = z.number().min(-180).max(180);

// --- Workspace ---

export const WorkspaceCreateSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty'),
  slug: z.string().slugify().min(1, 'Slug cannot be empty'),
  description: z.string().nullish(),
  logo: z.httpUrl().nullish(),
  type: z.enum(WORKSPACE_TYPES),
  industry: z.enum(WORKSPACE_INDUSTRIES),
  billingEmail: z.email().nullish(),
});

export const WorkspaceUpdateSchema = WorkspaceCreateSchema.partial();

// --- Relation base shapes ---

/**
 * Member and location embed each other, so each is split into a `*Base` shape (its
 * own columns) and a full shape (base + the cross-relation). Embeds use the flat
 * `*Base` shape and only direct reads add the cross-relation - this caps nesting at
 * one level and keeps the two schemas from referencing each other in a cycle.
 */
export const WorkspaceMemberBaseSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  displayName: z.string().nullish(),
  title: z.string().nullish(),
  role: z.enum(WORKSPACE_MEMBER_ROLES),
  status: z.enum(WORKSPACE_MEMBER_STATUSES),
  phone: z.string().nullish(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const WorkspaceLocationBaseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  address: z.string().nullish(),
  latitude: LatitudeSchema.nullish(),
  longitude: LongitudeSchema.nullish(),
  phone: z.string().nullish(),
  email: z.email().nullish(),
  isDefault: z.boolean(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

// --- Member ---

/**
 * A direct member read: `locations` (the member's assigned locations) is present
 * only here; list and workspace embeds return the flat base shape.
 */
export const WorkspaceMemberSchema = WorkspaceMemberBaseSchema.extend({
  locations: z.array(WorkspaceLocationBaseSchema).optional(),
});

export const WorkspaceMemberUpdateSchema = z.object({
  displayName: z.string().nullish(),
  title: z.string().nullish(),
  phone: z.string().nullish(),
});

export const WorkspaceMemberRoleUpdateSchema = z.object({
  role: z.enum(WORKSPACE_MEMBER_ROLES),
});

export const WorkspaceMemberRemoveSchema = z.object({
  /** The member to hand this member's work over to. */
  reassignToMemberId: z.uuid().nullish(),
});

// --- Location ---

/**
 * A direct location read: `members` (the location's assigned members) is present
 * only here; list and workspace embeds return the flat base shape.
 */
export const WorkspaceLocationSchema = WorkspaceLocationBaseSchema.extend({
  members: z.array(WorkspaceMemberBaseSchema).optional(),
});

export const WorkspaceLocationCreateSchema = z.object({
  name: z.string(),
  address: z.string().nullish(),
  latitude: LatitudeSchema.nullish(),
  longitude: LongitudeSchema.nullish(),
  phone: z.string().nullish(),
  email: z.email().nullish(),
});

export const WorkspaceLocationUpdateSchema = WorkspaceLocationCreateSchema.partial();

export const WorkspaceLocationMemberRemoveSchema = z.object({
  /** The member to hand this member's work at this location over to. */
  reassignToMemberId: z.uuid().nullish(),
});

// --- Invite ---

/**
 * `location` (target location) and `invitedByMember` (sender) are embedded on
 * direct invite reads; `null` when the underlying id is unset, omitted when not loaded.
 */
export const WorkspaceInviteSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  name: z.string(),
  role: z.enum(WORKSPACE_MEMBER_ROLES),
  status: z.enum(WORKSPACE_INVITE_STATUSES),
  token: z.string().min(1),
  workspaceId: z.uuid(),
  locationId: z.uuid().nullish(),
  invitedByMemberId: z.uuid().nullish(),
  expiresAt: z.iso.datetime(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  location: WorkspaceLocationBaseSchema.nullish(),
  invitedByMember: WorkspaceMemberBaseSchema.nullish(),
});

export const WorkspaceInviteCreateSchema = z.object({
  email: z.email(),
  name: z.string(),
  role: z.enum(WORKSPACE_MEMBER_ROLES),
  locationId: z.uuid().nullish(),
});

export const WorkspaceInvitePreviewSchema = z.object({
  email: z.email(),
  name: z.string(),
  role: z.enum(WORKSPACE_MEMBER_ROLES),
  workspaceName: z.string(),
  workspaceLogo: z.string().nullish(),
  invitedByName: z.string().nullish(),
  expiresAt: z.iso.datetime(),
});

// --- Workspace resource ---

/**
 * The full workspace resource as returned by the API: the creatable fields plus
 * the server-generated `id` and timestamps. Single source of truth for both the
 * `Workspace` type and runtime validation (tests, OpenAPI).
 *
 * Relations are optional - each is present only when the caller's role was
 * permitted to load it, so the contract stays role-agnostic (see `scopeRelations`).
 */
export const WorkspaceSchema = WorkspaceCreateSchema.extend({
  id: z.uuid(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  members: z.array(WorkspaceMemberSchema).optional(),
  locations: z.array(WorkspaceLocationSchema).optional(),
  invites: z.array(WorkspaceInviteSchema).optional(),
  /**
   * Single object, not an array: a workspace keeps many subscription rows over
   * time but only one is `active`.
   */
  subscription: WorkspaceSubscriptionReadSchema.optional(),
});

/**
 * A minimal workspace projection for listing a user's workspaces (e.g. a
 * switcher dropdown): no relations, no timestamps.
 */
export const WorkspaceSummarySchema = z.object({
  id: z.uuid(),
  slug: z.string(),
  name: z.string(),
  logo: z.httpUrl().nullish(),
  type: z.enum(WORKSPACE_TYPES),
  industry: z.enum(WORKSPACE_INDUSTRIES),
});

/** Response shape for the "is this slug taken?" endpoint. */
export const WorkspaceSlugExistsSchema = z.object({
  exists: z.boolean(),
});
