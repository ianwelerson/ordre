import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  index,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import {
  WORKSPACE_INDUSTRIES,
  WORKSPACE_INVITE_STATUSES,
  WORKSPACE_MEMBER_ROLES,
  WORKSPACE_MEMBER_STATUSES,
  WORKSPACE_RELATION,
  WORKSPACE_TYPES,
} from '@ordre/core/enums';

import { user } from './better-auth.ts';
import { workspaceSubscription } from './billing.ts';

// ---- Enums ----

export const workspaceType = pgEnum('workspace_type', WORKSPACE_TYPES);
export const workspaceIndustry = pgEnum('workspace_industry', WORKSPACE_INDUSTRIES);
export const workspaceMemberRole = pgEnum('workspace_member_role', WORKSPACE_MEMBER_ROLES);
export const workspaceMemberStatus = pgEnum('workspace_member_status', WORKSPACE_MEMBER_STATUSES);
export const workspaceInviteStatus = pgEnum('workspace_invite_status', WORKSPACE_INVITE_STATUSES);

// ---- Tables ----

export const workspace = pgTable('workspace', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  logo: text('logo'),
  type: workspaceType('type').notNull(),
  industry: workspaceIndustry('industry').notNull(),
  billingEmail: text('billing_email'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const workspaceLocation = pgTable(
  'workspace_location',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspace.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    address: text('address'),
    /**
     * `numeric` is Postgres' exact decimal type - it stores the digits given
     * rather than the nearest binary approximation, so a coordinate survives a
     * round trip unchanged (`double precision` cannot promise that).
     *
     * `scale: 6` resolves to ~11cm; the precision differs only in the integer
     * part, latitude spanning -90..90 and longitude -180..180.
     *
     * `mode: 'number'` returns a JS number instead of Drizzle's default string.
     * Safe only because these are small and fixed-scale - the default exists for
     * values that lose digits in a float64 (money, big counters).
     *
     * Proximity search ("locations within 5km") would need PostGIS
     * `geography(Point, 4326)`; independent numerics cannot index distance.
     */
    latitude: numeric('latitude', { precision: 8, scale: 6, mode: 'number' }),
    longitude: numeric('longitude', { precision: 9, scale: 6, mode: 'number' }),
    phone: text('phone'),
    email: text('email'),
    isDefault: boolean('is_default').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    index('workspace_location_workspace_id_idx').on(t.workspaceId),
    // At most one default location per workspace (only constrains `is_default = true` rows)
    uniqueIndex('workspace_location_one_default_per_workspace')
      .on(t.workspaceId)
      .where(sql`${t.isDefault}`),
  ]
);

export const workspaceMember = pgTable(
  'workspace_member',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspace.id, { onDelete: 'cascade' }),
    displayName: text('display_name'),
    title: text('title'),
    role: workspaceMemberRole('role').notNull(),
    status: workspaceMemberStatus('status').notNull(),
    phone: text('phone'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (t) => [
    unique('workspace_member_user_workspace_unique').on(t.userId, t.workspaceId),
    // `user_id` lookups are served by the leftmost column of the unique above
    index('workspace_member_workspace_id_idx').on(t.workspaceId),
  ]
);

export const workspaceMemberLocation = pgTable(
  'workspace_member_location',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    memberId: uuid('member_id')
      .notNull()
      .references(() => workspaceMember.id, { onDelete: 'cascade' }),
    locationId: uuid('location_id')
      .notNull()
      .references(() => workspaceLocation.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (t) => [
    unique('workspace_member_location_unique').on(t.memberId, t.locationId),
    // `member_id` lookups are served by the leftmost column of the unique above
    index('workspace_member_location_location_id_idx').on(t.locationId),
  ]
);

export const workspaceInvite = pgTable(
  'workspace_invite',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: text('email').notNull(),
    name: text('name').notNull(),
    role: workspaceMemberRole('role').notNull(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspace.id, { onDelete: 'cascade' }),
    locationId: uuid('location_id').references(() => workspaceLocation.id, {
      onDelete: 'no action',
    }),
    invitedByMemberId: uuid('invited_by_member_id').references(() => workspaceMember.id, {
      onDelete: 'set null',
    }),
    token: text('token').notNull().unique(),
    status: workspaceInviteStatus('status').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (t) => [
    // Only one *pending* invite per (workspace, email); expired/declined ones don't block re-inviting.
    uniqueIndex('workspace_invite_workspace_email_pending_unique')
      .on(t.workspaceId, t.email)
      .where(sql`${t.status} = 'pending'`),
    // Partial unique above doesn't cover the FK (it's filtered), so index the FK columns explicitly
    index('workspace_invite_workspace_id_idx').on(t.workspaceId),
    index('workspace_invite_location_id_idx').on(t.locationId),
    index('workspace_invite_invited_by_member_id_idx').on(t.invitedByMemberId),
    index('workspace_invite_pending_expiry_idx')
      .on(t.expiresAt)
      .where(sql`${t.status} = 'pending'`),
  ]
);

// ---- Relations ----

export const workspaceRelations = relations(workspace, ({ many }) => ({
  [WORKSPACE_RELATION.LOCATIONS]: many(workspaceLocation),
  [WORKSPACE_RELATION.MEMBERS]: many(workspaceMember),
  [WORKSPACE_RELATION.INVITES]: many(workspaceInvite),
  // A workspace accumulates subscription rows over time (only one is `active`,
  // enforced by a partial unique index). Modeled as `many` so history is
  // representable; callers filter to the active one at query time.
  [WORKSPACE_RELATION.SUBSCRIPTION]: many(workspaceSubscription),
}));

export const workspaceLocationRelations = relations(workspaceLocation, ({ one, many }) => ({
  workspace: one(workspace, {
    fields: [workspaceLocation.workspaceId],
    references: [workspace.id],
  }),
  // Join rows, not members - reach the member through `.member`.
  members: many(workspaceMemberLocation),
  invites: many(workspaceInvite),
}));

export const workspaceMemberRelations = relations(workspaceMember, ({ one, many }) => ({
  user: one(user, {
    fields: [workspaceMember.userId],
    references: [user.id],
  }),
  workspace: one(workspace, {
    fields: [workspaceMember.workspaceId],
    references: [workspace.id],
  }),
  // Join rows, not locations - reach the location through `.location`.
  locations: many(workspaceMemberLocation),
  sentInvites: many(workspaceInvite),
}));

export const workspaceMemberLocationRelations = relations(workspaceMemberLocation, ({ one }) => ({
  member: one(workspaceMember, {
    fields: [workspaceMemberLocation.memberId],
    references: [workspaceMember.id],
  }),
  location: one(workspaceLocation, {
    fields: [workspaceMemberLocation.locationId],
    references: [workspaceLocation.id],
  }),
}));

export const workspaceInviteRelations = relations(workspaceInvite, ({ one }) => ({
  workspace: one(workspace, {
    fields: [workspaceInvite.workspaceId],
    references: [workspace.id],
  }),
  location: one(workspaceLocation, {
    fields: [workspaceInvite.locationId],
    references: [workspaceLocation.id],
  }),
  invitedByMember: one(workspaceMember, {
    fields: [workspaceInvite.invitedByMemberId],
    references: [workspaceMember.id],
  }),
}));
