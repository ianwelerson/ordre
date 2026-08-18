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
  INVITE_NOT_FOUND: { status: 404 },
  INVITE_CREATE_FAILED: { status: 500 },
  INVITE_ALREADY_PENDING: { status: 409 },
  INVITE_EMAIL_MISMATCH: { status: 403 },
} satisfies ErrorMap;
