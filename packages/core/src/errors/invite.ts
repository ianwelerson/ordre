import type { ErrorMap } from '../types/index.ts';

/**
 * Errors for workspace invites.
 *
 * There is no `INVITE_EXPIRED`: `app_invite_preview` / `app_invite_accept` (see
 * migration 0002) filter on `expires_at > now()`, so an expired invite is
 * indistinguishable from a missing one at the API boundary and reads as
 * `INVITE_NOT_FOUND`. Adding the code means changing those functions first.
 */
export const INVITE_ERRORS = {
  INVITE_NOT_FOUND: {
    status: 404,
    message: "We couldn't find the invite you're looking for",
  },
  INVITE_CREATE_FAILED: {
    status: 500,
    message: 'Something went wrong while creating the invite. Please try again',
  },
  INVITE_ALREADY_PENDING: {
    status: 409,
    message: 'There is already a pending invite for this email',
  },
  INVITE_EMAIL_MISMATCH: {
    status: 403,
    message: 'This invite was sent to a different email address',
  },
} satisfies ErrorMap;
