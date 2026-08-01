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
  WORKSPACE_NOT_FOUND: {
    status: 404,
    message: "We couldn't find the workspace you're looking for",
  },
  WORKSPACE_CREATE_FAILED: {
    status: 500,
    message: 'Something went wrong while creating your workspace. Please try again',
  },

  // --- Slug ---
  WORKSPACE_SLUG_ALREADY_EXISTS: {
    status: 409,
    message: 'That workspace URL is already taken',
  },
  WORKSPACE_SLUG_RESERVED: {
    status: 400,
    message: 'This name is reserved. Please choose another',
  },
  WORKSPACE_SLUG_PROTECTED: {
    status: 400,
    message: 'This name is reserved. If it belongs to your organization, get in contact with us',
  },
  WORKSPACE_SLUG_BANNED: {
    status: 400,
    message: "This name isn't available. Please choose another",
  },
} satisfies ErrorMap;
