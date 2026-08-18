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
  MEMBER_NOT_FOUND: { status: 404 },
  MEMBER_ALREADY_EXISTS: { status: 409 },
  MEMBER_LAST_OWNER: { status: 409 },
  MEMBER_TARGET_SUSPENDED: { status: 409 },

  // --- Caller policy ---
  MEMBER_SELF_SUSPENDED: { status: 403 },
  MEMBER_SELF_ROLE_UPDATE: { status: 403 },
  MEMBER_SELF_REMOVE: { status: 403 },
  MEMBER_OWNER_ROLE_FORBIDDEN: { status: 403 },
  MEMBER_REMOVE_FORBIDDEN: { status: 403 },
} satisfies ErrorMap;
