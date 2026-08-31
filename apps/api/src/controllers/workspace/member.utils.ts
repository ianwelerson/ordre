import { getDb } from '#/config/db-context.ts';
import type { Schema, WorkspaceMemberRow } from '#/types/db.ts';
import { and, type BuildQueryResult, desc, eq } from 'drizzle-orm';
import type { PgTransaction } from 'drizzle-orm/pg-core';

import type {
  WorkspaceMember,
  WorkspaceMemberBase,
  WorkspaceMemberUpdate,
} from '@ordre/core/types';
import * as schema from '@ordre/db/schemas';

import { toLocationBase } from './location.utils.ts';

const withLocations = {
  locations: { with: { location: true } },
} as const;

/** A member row with its locations loaded, as returned by a direct member read. */
type WorkspaceMemberWithLocations = BuildQueryResult<
  Schema,
  Schema['workspaceMember'],
  { with: typeof withLocations }
>;

/**
 * A member row accepted by {@link toMemberResponse}. `locations` is
 * optional: direct reads load it (and get `locations` in the response), while
 * list rows and freshly inserted/updated rows omit it.
 */
type WorkspaceMemberForResponse = WorkspaceMemberRow & {
  locations?: WorkspaceMemberWithLocations['locations'];
};

/** A Drizzle transaction handle (as passed to `db.transaction(async (tx) => ...)`). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Tx = PgTransaction<any, any, any>;

/**
 * Counts the workspace's active owners while taking a row lock (`FOR UPDATE`) on
 * them, so a concurrent role change can't also read "one owner remaining" and race
 * the workspace down to zero owners. Must run inside a transaction.
 *
 * @param tx - The active transaction; the lock is held until it commits.
 * @param workspaceId - The workspace whose active owners to count.
 * @returns The number of active owners in the workspace.
 */
export const countActiveOwnersForUpdate = async (tx: Tx, workspaceId: string): Promise<number> => {
  const owners = await tx
    .select({ id: schema.workspaceMember.id })
    .from(schema.workspaceMember)
    .where(
      and(
        eq(schema.workspaceMember.workspaceId, workspaceId),
        eq(schema.workspaceMember.role, 'owner'),
        eq(schema.workspaceMember.status, 'active')
      )
    )
    .for('update');

  return owners.length;
};

/** Outcome of `suspendMember`: the updated row, the last-owner refusal, or no match. */
export type SuspendMemberResult = WorkspaceMemberRow | 'LAST_OWNER' | undefined;

/**
 * Soft-removes a member inside a transaction: status -> `suspended`, role reset
 * to `member`, and `phone` cleared, while keeping `displayName`/`title` for audit
 * and reactivation on re-invite. Refuses (returns `'LAST_OWNER'`) when the target
 * is the workspace's last active owner - the owner count is taken under a row
 * lock so concurrent removals can't race it to zero. Shared by the "remove
 * another member" and "leave the workspace" flows.
 *
 * @param target - The member to suspend; supplies the id, workspace scope, and current role/status.
 * @returns The updated row, `'LAST_OWNER'` if it would remove the last active owner, or `undefined` if no row matched.
 */
export const suspendMember = (
  target: Pick<WorkspaceMemberRow, 'id' | 'workspaceId' | 'role' | 'status'>
): Promise<SuspendMemberResult> =>
  getDb().transaction(async (tx) => {
    if (target.role === 'owner' && target.status === 'active') {
      const activeOwners = await countActiveOwnersForUpdate(tx, target.workspaceId);

      if (activeOwners <= 1) {
        return 'LAST_OWNER' as const;
      }
    }

    const [updated] = await tx
      .update(schema.workspaceMember)
      .set({ status: 'suspended', role: 'member', phone: null })
      .where(
        and(
          eq(schema.workspaceMember.workspaceId, target.workspaceId),
          eq(schema.workspaceMember.id, target.id)
        )
      )
      .returning();

    return updated;
  });

/**
 * Lists every member of a workspace, newest first.
 *
 * @param workspaceId - The workspace whose members to load.
 * @returns The member rows.
 */
export const findMembers = (workspaceId: string): Promise<WorkspaceMemberRow[]> =>
  getDb().query.workspaceMember.findMany({
    where: eq(schema.workspaceMember.workspaceId, workspaceId),
    orderBy: [desc(schema.workspaceMember.createdAt)],
  });

/**
 * Fetches a single member scoped to its workspace, with the locations they're
 * assigned to. Scoping by `workspaceId` (not just the member id) keeps a caller
 * from touching a member in another workspace, independent of RLS.
 *
 * @param workspaceId - The workspace the member must belong to.
 * @param memberId - The member id.
 * @returns The member row with its locations, or `undefined` if none matches within the workspace.
 */
export const findMember = (
  workspaceId: string,
  memberId: string
): Promise<WorkspaceMemberWithLocations | undefined> =>
  getDb().query.workspaceMember.findFirst({
    where: and(
      eq(schema.workspaceMember.workspaceId, workspaceId),
      eq(schema.workspaceMember.id, memberId)
    ),
    with: withLocations,
  });

/**
 * Applies a profile update to a member scoped to its workspace. Scoping by
 * `workspaceId` (on top of the id) keeps a caller from updating a member in
 * another workspace, independent of RLS. Callers pre-check for the empty payload,
 * so `data` is always non-empty here (Drizzle throws on `.set({})`).
 *
 * @param workspaceId - The workspace the member must belong to.
 * @param memberId - The member id.
 * @param data - The profile fields to change.
 * @returns The updated member row, or `undefined` if none matches within the workspace.
 */
export const updateMember = async (
  workspaceId: string,
  memberId: string,
  data: WorkspaceMemberUpdate
): Promise<WorkspaceMemberRow | undefined> => {
  const [updated] = await getDb()
    .update(schema.workspaceMember)
    .set(data)
    .where(
      and(
        eq(schema.workspaceMember.workspaceId, workspaceId),
        eq(schema.workspaceMember.id, memberId)
      )
    )
    .returning();

  return updated;
};

/** Maps a workspace member row to its flat response shape, with no embedded relations. */
export const toMemberBase = (member: WorkspaceMemberRow): WorkspaceMemberBase => ({
  id: member.id,
  userId: member.userId,
  displayName: member.displayName,
  title: member.title,
  role: member.role,
  status: member.status,
  phone: member.phone,
  createdAt: member.createdAt.toISOString(),
  updatedAt: member.updatedAt.toISOString(),
  locale: member.locale,
});

/**
 * Maps a workspace member row to its public response shape, embedding `locations`
 * when the relation was loaded (see {@link findMember}).
 */
export const toMemberResponse = (member: WorkspaceMemberForResponse): WorkspaceMember => ({
  ...toMemberBase(member),
  ...(member.locations && {
    locations: member.locations.map((ml) => toLocationBase(ml.location)),
  }),
});
