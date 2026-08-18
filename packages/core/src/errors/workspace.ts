import type { ErrorMap } from '../types/index.ts';

/**
 * Errors for the workspace resource itself. Its sub-resources have their own
 * catalogs (`LOCATION_ERRORS`, `MEMBER_ERRORS`, `INVITE_ERRORS`).
 *
 * Every key carries its resource prefix because the key *is* the `code` the
 * client receives (see `errorResponse`), so a bare `NOT_FOUND` would be
 * ambiguous across domains.
 */
export const WORKSPACE_ERRORS = {
  // --- Lifecycle ---
  WORKSPACE_NOT_FOUND: { status: 404 },
  WORKSPACE_CREATE_FAILED: { status: 500 },

  // --- Slug ---
  WORKSPACE_SLUG_ALREADY_EXISTS: { status: 409 },
  WORKSPACE_SLUG_RESERVED: { status: 400 },
  WORKSPACE_SLUG_PROTECTED: { status: 400 },
  WORKSPACE_SLUG_BANNED: { status: 400 },
} satisfies ErrorMap;
