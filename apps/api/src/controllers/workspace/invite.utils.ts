import { getDb } from '#/config/db-context.ts';
import type { WorkspaceInviteRow, WorkspaceLocationRow, WorkspaceMemberRow } from '#/types/db.ts';
import { and, desc, eq, lte } from 'drizzle-orm';

import type { WorkspaceInvite, WorkspaceInvitePreview } from '@ordre/core/types';
import * as schema from '@ordre/db/schemas';

import { toLocationBase } from './location.utils.ts';
import { toMemberBase } from './member.utils.ts';

/** The relations an invite read loads: its target location and the member who sent it. */
export const inviteWith = {
  location: true,
  invitedByMember: true,
} as const;

/**
 * An invite row accepted by {@link toInviteResponse}. `location` and
 * `invitedByMember` are optional (omitted when not loaded) and nullable (the
 * underlying id can be unset).
 */
type WorkspaceInviteForResponse = WorkspaceInviteRow & {
  location?: WorkspaceLocationRow | null;
  invitedByMember?: WorkspaceMemberRow | null;
};

/**
 * Maps a workspace member invite row to its public response shape, embedding
 * `location` and `invitedByMember` when those relations were loaded.
 */
export const toInviteResponse = (invite: WorkspaceInviteForResponse): WorkspaceInvite => ({
  id: invite.id,
  email: invite.email,
  name: invite.name,
  role: invite.role,
  workspaceId: invite.workspaceId,
  locationId: invite.locationId,
  status: invite.status,
  invitedByMemberId: invite.invitedByMemberId,
  createdAt: invite.createdAt.toISOString(),
  updatedAt: invite.updatedAt.toISOString(),
  expiresAt: invite.expiresAt.toISOString(),
  ...(invite.location !== undefined && {
    location: invite.location && toLocationBase(invite.location),
  }),
  ...(invite.invitedByMember !== undefined && {
    invitedByMember: invite.invitedByMember && toMemberBase(invite.invitedByMember),
  }),
});

/** Maps an `app_invite_preview` row (see {@link InvitePreviewRow}) to the public preview response. */
export const toInvitePreviewResponse = (invite: InvitePreviewRow): WorkspaceInvitePreview => ({
  email: invite.invite_email,
  name: invite.invitee_name,
  role: invite.member_role,
  workspaceName: invite.workspace_name,
  workspaceLogo: invite.workspace_logo,
  invitedByName: invite.invited_by_name,
  // Already ISO-8601 UTC - `app_invite_preview` formats it in SQL (see below).
  expiresAt: new Date(invite.expires_at).toISOString(),
});

/**
 * Row shape returned by the `app_invite_preview(token)` SQL function.
 *
 * The keys must stay in lockstep with that function's `RETURNS TABLE` columns
 * (see migration 0002) - there's no compile-time link between the two, so change
 * both together. `snake_case` mirrors the SQL column names verbatim.
 *
 * Note `expires_at` is a `string`, not a `Date`: `db.execute()` (raw SQL) does not
 * run pg's type parsers, unlike the drizzle query builder, so every column arrives
 * as text. The function therefore hands back an already-ISO-8601-UTC string
 * (`2026-07-31T20:21:00.143Z`) instead of the raw `timestamptz`, whose Postgres
 * rendering carries the session's zone offset and is not reliably parseable.
 */
export type InvitePreviewRow = {
  invite_email: string;
  invitee_name: string;
  member_role: WorkspaceInvite['role'];
  workspace_name: string;
  workspace_logo: string | null;
  invited_by_name: string | null;
  expires_at: string;
};

/**
 * Lists every invite in a workspace, newest first.
 *
 * @param workspaceId - The workspace whose invites to load.
 * @returns The invite rows.
 */
export const findInvites = (workspaceId: string) =>
  getDb().query.workspaceInvite.findMany({
    where: eq(schema.workspaceInvite.workspaceId, workspaceId),
    orderBy: desc(schema.workspaceInvite.createdAt),
    with: inviteWith,
  });

/**
 * Fetches a single invite scoped to its workspace, with its relations. Scoping by
 * `workspaceId` (not just the invite id) keeps a caller from touching an invite in
 * another workspace, independent of RLS.
 *
 * @param workspaceId - The workspace the invite must belong to.
 * @param inviteId - The invite id.
 * @returns The invite row with its relations, or `undefined` if none matches within the workspace.
 */
export const findInvite = (workspaceId: string, inviteId: string) =>
  getDb().query.workspaceInvite.findFirst({
    where: and(
      eq(schema.workspaceInvite.id, inviteId),
      eq(schema.workspaceInvite.workspaceId, workspaceId)
    ),
    with: inviteWith,
  });

/**
 * Expires any *stale* (past-`expiresAt`) pending invite for an email, so a dead
 * row can't block a re-invite: the partial unique index and the "already pending"
 * pre-check both key off `status = 'pending'`.
 *
 * @param workspaceId - The workspace to scope the expiry to.
 * @param email - The invitee email whose stale pending invite to expire.
 */
export const expireStalePendingInvite = async (
  workspaceId: string,
  email: string
): Promise<void> => {
  await getDb()
    .update(schema.workspaceInvite)
    .set({ status: 'expired' })
    .where(
      and(
        eq(schema.workspaceInvite.workspaceId, workspaceId),
        eq(schema.workspaceInvite.email, email),
        eq(schema.workspaceInvite.status, 'pending'),
        lte(schema.workspaceInvite.expiresAt, new Date())
      )
    );
};

/**
 * Checks whether the workspace already has an *active* member whose user account
 * carries this email (an invite to an existing member is rejected).
 *
 * @param workspaceId - The workspace to search within.
 * @param email - The email to match against active members' user accounts.
 * @returns `true` if an active member with that email exists.
 */
export const hasActiveMemberWithEmail = async (
  workspaceId: string,
  email: string
): Promise<boolean> => {
  const [existing] = await getDb()
    .select({ id: schema.workspaceMember.id })
    .from(schema.workspaceMember)
    .innerJoin(schema.user, eq(schema.user.id, schema.workspaceMember.userId))
    .where(
      and(
        eq(schema.workspaceMember.workspaceId, workspaceId),
        eq(schema.workspaceMember.status, 'active'),
        eq(schema.user.email, email)
      )
    )
    .limit(1);

  return Boolean(existing);
};

/**
 * Checks whether a *pending* invite already exists for an email in the workspace.
 * Only one pending invite per (workspace, email) is allowed (enforced by the
 * `workspace_invite_workspace_email_pending_unique` index).
 *
 * @param workspaceId - The workspace to search within.
 * @param email - The invitee email to check.
 * @returns `true` if a pending invite for that email exists.
 */
export const hasPendingInvite = async (workspaceId: string, email: string): Promise<boolean> => {
  const pending = await getDb().query.workspaceInvite.findFirst({
    columns: { id: true },
    where: and(
      eq(schema.workspaceInvite.workspaceId, workspaceId),
      eq(schema.workspaceInvite.email, email),
      eq(schema.workspaceInvite.status, 'pending')
    ),
  });

  return Boolean(pending);
};
