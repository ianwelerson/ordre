import type { WorkspaceMemberRole, WorkspaceRelation } from '../enums/index.ts';

// ------- Permission Definition -------

/**
 * The complete set of permissions that can be granted within a workspace,
 * expressed as `domain:resource:action` strings.
 */
export const WORKSPACE_PERMISSIONS = [
  // Workspace
  'workspace:read',
  'workspace:update',
  'workspace:delete',
  // Workspace Members
  'workspace:member:read',
  'workspace:member:manage',
  // Workspace Location
  'workspace:location:read',
  'workspace:location:manage',
  // Workspace Subscription
  'workspace:subscription:read',
  'workspace:subscription:manage',
] as const;

/** A single workspace permission, derived from {@link WORKSPACE_PERMISSIONS}. */
export type WorkspacePermission = (typeof WORKSPACE_PERMISSIONS)[number];

// ------- Role Permissions -------

/** Maps each workspace member role to the permissions it is granted. */
export const WORKSPACE_ROLE_PERMISSIONS: Record<
  WorkspaceMemberRole,
  readonly WorkspacePermission[]
> = {
  owner: [
    'workspace:read',
    'workspace:update',
    'workspace:delete',
    'workspace:member:read',
    'workspace:member:manage',
    'workspace:location:read',
    'workspace:location:manage',
    'workspace:subscription:read',
    'workspace:subscription:manage',
  ],
  admin: [
    'workspace:read',
    'workspace:update',
    'workspace:member:read',
    'workspace:member:manage',
    'workspace:location:read',
    'workspace:location:manage',
    'workspace:subscription:read',
  ],
  member: [
    'workspace:read',
    'workspace:location:read',
    'workspace:member:read',
    'workspace:subscription:read',
  ],
};

/**
 * Checks whether a workspace member role is granted a given permission.
 *
 * @param role - The workspace member role to check.
 * @param permission - The permission required for the action.
 * @returns `true` if the role grants the permission, otherwise `false`.
 *
 * @example
 * can('admin', 'workspace:update'); // true
 * can('member', 'workspace:delete'); // false
 */
export const can = (role: WorkspaceMemberRole, permission: WorkspacePermission) => {
  return WORKSPACE_ROLE_PERMISSIONS[role].includes(permission);
};

// ------- Relation Permissions -------

/**
 * Maps a gated workspace relation to the permission a role must hold to load it.
 * A relation absent from this map is treated as not exposable by `scopeRelations`
 * (default-deny). Keys are the Drizzle relation names on the `workspace` table.
 */
export const WORKSPACE_RELATION_PERMISSIONS: Partial<
  Record<WorkspaceRelation, WorkspacePermission>
> = {
  members: 'workspace:member:read',
  locations: 'workspace:location:read',
  invites: 'workspace:member:manage',
  subscription: 'workspace:subscription:read',
};

/**
 * Filters a requested set of workspace relations down to the ones `role` is
 * permitted to see, per {@link WORKSPACE_RELATION_PERMISSIONS}. Intended to build
 * the `with` clause of a Drizzle read so unauthorized relations are never even
 * queried (default-deny: a relation not in the map is dropped).
 *
 * @param role - The caller's workspace member role.
 * @param requested - The relations to include, keyed by relation name (e.g. `{ members: true }`).
 * @returns The subset of `requested` the role may load.
 *
 * @example
 * scopeRelations('member', { members: true, invites: true }); // -> { members: true }
 */
export const scopeRelations = <T extends Partial<Record<WorkspaceRelation, unknown>>>(
  role: WorkspaceMemberRole,
  requested: T
): Partial<T> => {
  const out: Partial<T> = {};

  for (const key of Object.keys(requested) as (keyof T & WorkspaceRelation)[]) {
    const required = WORKSPACE_RELATION_PERMISSIONS[key];

    if (required && can(role, required)) {
      out[key] = requested[key];
    }
  }

  return out;
};
