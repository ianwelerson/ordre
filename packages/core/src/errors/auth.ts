import type { ErrorMap } from '../types/index.ts';

/**
 * Mirror of Better Auth's `BASE_ERROR_CODES` (the `emailAndPassword` core set).
 *
 * Each key matches the `code` Better Auth returns in its error body, so a
 * consumer (FE, gateway, etc.) can map a raw Better Auth response straight to
 * our own definition: `AUTH_ERRORS[response.body.code]`.
 *
 * - `message` is the exact string Better Auth ships, kept verbatim so reverse
 *   lookups by message still work.
 * - `status` is the HTTP status Better Auth throws the code with in its route
 *   handlers. A handful of codes are thrown with different statuses depending
 *   on the route; in those cases the most representative one is used and the
 *   alternates are noted inline. The status here is what the client actually
 *   receives - `remapAuthError` replaces Better Auth's with ours - so a code
 *   Better Auth throws with the wrong status is corrected here and noted.
 *
 * Validation-related codes (`VALIDATION_ERROR`, `MISSING_FIELD`,
 * `FIELD_NOT_ALLOWED`, `BODY_MUST_BE_AN_OBJECT`,
 * `ASYNC_VALIDATION_NOT_SUPPORTED`) live in `VALIDATION_ERRORS` so input
 * errors have a single source of truth across the API. `UNAUTHORIZED` and
 * `FORBIDDEN` are ours rather than Better Auth's and live in `BASE_ERRORS`,
 * keeping this file a pure mirror.
 *
 * Source: better-auth@1.6.12 `@better-auth/core/error` codes + route handlers.
 */
export const AUTH_ERRORS = {
  // --- User ---
  USER_NOT_FOUND: { status: 404 }, // also thrown as 400 / 401 on some routes
  FAILED_TO_CREATE_USER: { status: 422 }, // also 400 / 500 depending on cause
  FAILED_TO_UPDATE_USER: { status: 500 },
  INVALID_USER: { status: 401 },
  USER_EMAIL_NOT_FOUND: { status: 401 },
  USER_ALREADY_EXISTS: { status: 422 }, // also 400 on some routes
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: { status: 422 },
  USER_ALREADY_HAS_PASSWORD: { status: 400 },

  // --- Account / linking ---
  ACCOUNT_NOT_FOUND: { status: 400 },
  CREDENTIAL_ACCOUNT_NOT_FOUND: { status: 400 },
  FAILED_TO_UNLINK_LAST_ACCOUNT: { status: 400 },
  LINKED_ACCOUNT_ALREADY_EXISTS: { status: 400 },
  SOCIAL_ACCOUNT_ALREADY_LINKED: { status: 400 },

  // --- Session ---
  FAILED_TO_CREATE_SESSION: { status: 500 }, // also 400 / 401 depending on route
  FAILED_TO_GET_SESSION: { status: 401 }, // also 500
  SESSION_EXPIRED: { status: 401 }, // Better Auth throws 400; an expired session is an authentication failure
  SESSION_NOT_FRESH: { status: 403 },

  // --- Credentials / password ---
  INVALID_PASSWORD: { status: 400 },
  INVALID_EMAIL: { status: 400 },
  INVALID_EMAIL_OR_PASSWORD: { status: 401 },
  PASSWORD_TOO_SHORT: { status: 400 },
  PASSWORD_TOO_LONG: { status: 400 },
  PASSWORD_ALREADY_SET: { status: 400 },

  // --- Email ---
  EMAIL_NOT_VERIFIED: { status: 403 },
  EMAIL_CAN_NOT_BE_UPDATED: { status: 400 },
  CHANGE_EMAIL_DISABLED: { status: 400 },
  EMAIL_ALREADY_VERIFIED: { status: 400 },
  EMAIL_MISMATCH: { status: 400 },
  VERIFICATION_EMAIL_NOT_ENABLED: { status: 400 },
  FAILED_TO_CREATE_VERIFICATION: { status: 500 },

  // --- Tokens / providers (OAuth / social) ---
  PROVIDER_NOT_FOUND: { status: 404 },
  INVALID_TOKEN: { status: 400 }, // also 401 / 404 depending on route
  TOKEN_EXPIRED: { status: 400 },
  ID_TOKEN_NOT_SUPPORTED: { status: 404 },
  FAILED_TO_GET_USER_INFO: { status: 401 }, // also 404

  // --- Origin / callback URLs ---
  INVALID_ORIGIN: { status: 403 },
  MISSING_OR_NULL_ORIGIN: { status: 403 },
  INVALID_CALLBACK_URL: { status: 403 },
  INVALID_REDIRECT_URL: { status: 403 },
  INVALID_ERROR_CALLBACK_URL: { status: 403 },
  INVALID_NEW_USER_CALLBACK_URL: { status: 403 },
  CALLBACK_URL_REQUIRED: { status: 400 },
  CROSS_SITE_NAVIGATION_LOGIN_BLOCKED: { status: 403 },

  // --- Request ---
  METHOD_NOT_ALLOWED_DEFER_SESSION_REQUIRED: { status: 405 },
} satisfies ErrorMap;
