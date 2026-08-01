import type { ErrorMap } from '../types/index.ts';

/**
 * Errors for workspace memberships.
 *
 * The split between 403 and 409 is deliberate: 403 means the *caller* isn't
 * allowed to perform the action (who is asking), 409 means the resource's
 * current state forbids it no matter who asks.
 */
export const MEMBER_ERRORS = {
  // --- Lookup / state ---
  MEMBER_NOT_FOUND: {
    status: 404,
    message: "We couldn't find the member you're looking for",
  },
  MEMBER_ALREADY_EXISTS: {
    status: 409,
    message: 'A member with this email already exists in the workspace',
  },
  MEMBER_LAST_OWNER: {
    status: 409,
    message: 'A workspace needs at least one owner. Assign another owner first',
  },
  MEMBER_TARGET_SUSPENDED: {
    status: 409,
    message: "You can't change the role for a suspended member",
  },

  // --- Caller policy ---
  MEMBER_SELF_SUSPENDED: {
    status: 403,
    message: 'Your access to this workspace has been suspended',
  },
  MEMBER_SELF_ROLE_UPDATE: {
    status: 403,
    message: "You can't change your own role",
  },
  MEMBER_SELF_REMOVE: {
    status: 403,
    message: "You can't remove yourself from the workspace",
  },
  MEMBER_OWNER_ROLE_FORBIDDEN: {
    status: 403,
    message: 'Only an owner can assign or change the owner role',
  },
  MEMBER_REMOVE_FORBIDDEN: {
    status: 403,
    message: 'You can only remove members, not owners or admins',
  },
} satisfies ErrorMap;
