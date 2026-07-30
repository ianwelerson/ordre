import { getDb } from '#/config/db-context.ts';
import type { Schema, WorkspaceLocationRow, WorkspaceMemberLocationRow } from '#/types/db.ts';
import { and, type BuildQueryResult, desc, eq } from 'drizzle-orm';

import type {
  WorkspaceLocation,
  WorkspaceLocationBase,
  WorkspaceLocationCreate,
  WorkspaceLocationUpdate,
} from '@ordre/core/types';
import * as schema from '@ordre/db/schemas';

import { toMemberBase } from './member.utils.ts';

const withMembers = {
  members: { with: { member: true } },
} as const;

/** A location row with its members loaded, as returned by a direct location read. */
type WorkspaceLocationWithMembers = BuildQueryResult<
  Schema,
  Schema['workspaceLocation'],
  { with: typeof withMembers }
>;

/**
 * A location row accepted by {@link toLocationResponse}. `members` is
 * optional: direct reads load it (and get `members` in the response), while list
 * rows and freshly inserted/updated rows omit it.
 */
type WorkspaceLocationForResponse = WorkspaceLocationRow & {
  members?: WorkspaceLocationWithMembers['members'];
};

/**
 * Fetches a single location scoped to its workspace, with its members. Scoping by
 * `workspaceId` (not just the location id) keeps a caller from touching a location
 * that lives in another workspace, independent of RLS.
 *
 * @param workspaceId - The workspace the location must belong to.
 * @param locationId - The location id.
 * @returns The location row with its members, or `undefined` if none matches within the workspace.
 */
export const findLocation = (
  workspaceId: string,
  locationId: string
): Promise<WorkspaceLocationWithMembers | undefined> =>
  getDb().query.workspaceLocation.findFirst({
    where: and(
      eq(schema.workspaceLocation.workspaceId, workspaceId),
      eq(schema.workspaceLocation.id, locationId)
    ),
    with: withMembers,
  });

/**
 * Fetches a workspace's default location. Every workspace is created with one
 * (see `workspaceCreate`), so a missing result signals a data-integrity problem.
 * An internal helper (e.g. delete reassignment), so it stays flat - no members.
 *
 * @param workspaceId - The workspace whose default location to load.
 * @returns The default location row, or `undefined` if the workspace has none.
 */
export const findDefaultLocation = (
  workspaceId: string
): Promise<WorkspaceLocationRow | undefined> =>
  getDb().query.workspaceLocation.findFirst({
    where: and(
      eq(schema.workspaceLocation.workspaceId, workspaceId),
      eq(schema.workspaceLocation.isDefault, true)
    ),
  });

/**
 * Lists every location in a workspace, default first, then newest. Kept flat (no
 * members) - a list shouldn't hydrate every location's members.
 *
 * @param workspaceId - The workspace whose locations to load.
 * @returns The location rows.
 */
export const findLocations = (workspaceId: string): Promise<WorkspaceLocationRow[]> =>
  getDb().query.workspaceLocation.findMany({
    where: eq(schema.workspaceLocation.workspaceId, workspaceId),
    orderBy: [desc(schema.workspaceLocation.isDefault), desc(schema.workspaceLocation.createdAt)],
  });

/**
 * Creates a location in a workspace.
 *
 * @param workspaceId - The workspace to attach the location to.
 * @param data - The location fields to create.
 * @returns The created location row, or `undefined` if the insert returned nothing.
 */
export const createLocation = async (
  workspaceId: string,
  data: WorkspaceLocationCreate
): Promise<WorkspaceLocationRow | undefined> => {
  const [created] = await getDb()
    .insert(schema.workspaceLocation)
    .values({ workspaceId, ...data })
    .returning();

  return created;
};

/**
 * Applies an update to a location scoped to its workspace. Scoping by
 * `workspaceId` (on top of the id) keeps a caller from touching a location in
 * another workspace and prevents moving one between workspaces. Callers pre-check
 * for the empty payload, so `data` is always non-empty here (Drizzle throws on
 * `.set({})`).
 *
 * @param workspaceId - The workspace the location must belong to.
 * @param locationId - The location id.
 * @param data - The fields to update.
 * @returns The updated location row, or `undefined` if none matches within the workspace.
 */
export const updateLocation = async (
  workspaceId: string,
  locationId: string,
  data: WorkspaceLocationUpdate
): Promise<WorkspaceLocationRow | undefined> => {
  const [updated] = await getDb()
    .update(schema.workspaceLocation)
    .set(data)
    .where(
      and(
        eq(schema.workspaceLocation.workspaceId, workspaceId),
        eq(schema.workspaceLocation.id, locationId)
      )
    )
    .returning();

  return updated;
};

/**
 * Links a member to a location (the assignment row that grants access). The
 * caller is expected to have already verified both ids belong to the workspace.
 * Throws on the unique `(member, location)` constraint if the link already
 * exists - the controller maps that to an idempotent success.
 *
 * @param locationId - The location to assign the member to.
 * @param memberId - The member being assigned.
 * @returns The created assignment row, or `undefined` if the insert returned nothing.
 */
export const assignMemberToLocation = async (
  locationId: string,
  memberId: string
): Promise<WorkspaceMemberLocationRow | undefined> => {
  const [assigned] = await getDb()
    .insert(schema.workspaceMemberLocation)
    .values({
      memberId,
      locationId,
    })
    .returning();

  return assigned;
};

/**
 * Removes the link between a member and a location (revoking access). Scoped to
 * the `(location, member)` pair; RLS keeps it within the caller's workspace.
 * A no-op when no such link exists, which keeps the unassign endpoint idempotent.
 *
 * @param locationId - The location to unassign the member from.
 * @param memberId - The member being unassigned.
 */
export const unassignMemberFromLocation = async (
  locationId: string,
  memberId: string
): Promise<void> => {
  await getDb()
    .delete(schema.workspaceMemberLocation)
    .where(
      and(
        eq(schema.workspaceMemberLocation.locationId, locationId),
        eq(schema.workspaceMemberLocation.memberId, memberId)
      )
    );
};

/** Maps a workspace location row to its flat response shape, with no embedded relations. */
export const toLocationBase = (location: WorkspaceLocationRow): WorkspaceLocationBase => ({
  id: location.id,
  name: location.name,
  address: location.address,
  longitude: location.longitude,
  latitude: location.latitude,
  phone: location.phone,
  email: location.email,
  isDefault: location.isDefault,
  createdAt: location.createdAt.toISOString(),
  updatedAt: location.updatedAt.toISOString(),
});

/**
 * Maps a workspace location row to its public response shape, embedding `members`
 * when the relation was loaded (see {@link findLocation}).
 */
export const toLocationResponse = (location: WorkspaceLocationForResponse): WorkspaceLocation => ({
  ...toLocationBase(location),
  ...(location.members && {
    members: location.members.map((ml) => toMemberBase(ml.member)),
  }),
});

/**
 * Checks whether a location belongs to the workspace. The invite FK only
 * guarantees the location exists, not that it's in *this* workspace, so an invite
 * must verify it before pointing at a location.
 *
 * @param workspaceId - The workspace the location must belong to.
 * @param locationId - The location id to verify.
 * @returns `true` if the location exists within the workspace.
 */
export const locationInWorkspace = async (
  workspaceId: string,
  locationId: string
): Promise<boolean> => {
  const location = await getDb().query.workspaceLocation.findFirst({
    columns: { id: true },
    where: and(
      eq(schema.workspaceLocation.id, locationId),
      eq(schema.workspaceLocation.workspaceId, workspaceId)
    ),
  });

  return Boolean(location);
};
