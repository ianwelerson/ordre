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
 *   alternates are noted inline.
 *
 * Validation-related codes (`VALIDATION_ERROR`, `MISSING_FIELD`,
 * `FIELD_NOT_ALLOWED`, `BODY_MUST_BE_AN_OBJECT`,
 * `ASYNC_VALIDATION_NOT_SUPPORTED`) live in `VALIDATION_ERRORS` so input
 * errors have a single source of truth across the API.
 *
 * Source: better-auth@1.6.12 `@better-auth/core/error` codes + route handlers.
 */
export const AUTH_ERRORS = {
  // --- User ---
  USER_NOT_FOUND: {
    status: 404, // also thrown as 400 / 401 on some routes
    message: 'User not found',
  },
  FAILED_TO_CREATE_USER: {
    status: 422, // also 400 / 500 depending on cause
    message: 'Failed to create user',
  },
  FAILED_TO_UPDATE_USER: {
    status: 500,
    message: 'Failed to update user',
  },
  INVALID_USER: {
    status: 401,
    message: 'Invalid user',
  },
  USER_EMAIL_NOT_FOUND: {
    status: 401,
    message: 'User email not found',
  },
  USER_ALREADY_EXISTS: {
    status: 422, // also 400 on some routes
    message: 'User already exists.',
  },
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: {
    status: 422,
    message: 'User already exists. Use another email.',
  },
  USER_ALREADY_HAS_PASSWORD: {
    status: 400,
    message: 'User already has a password. Provide that to delete the account.',
  },

  // --- Account / linking ---
  ACCOUNT_NOT_FOUND: {
    status: 400,
    message: 'Account not found',
  },
  CREDENTIAL_ACCOUNT_NOT_FOUND: {
    status: 400,
    message: 'Credential account not found',
  },
  FAILED_TO_UNLINK_LAST_ACCOUNT: {
    status: 400,
    message: "You can't unlink your last account",
  },
  LINKED_ACCOUNT_ALREADY_EXISTS: {
    status: 400,
    message: 'Linked account already exists',
  },
  SOCIAL_ACCOUNT_ALREADY_LINKED: {
    status: 400,
    message: 'Social account already linked',
  },

  // --- Session ---
  FAILED_TO_CREATE_SESSION: {
    status: 500, // also 400 / 401 depending on route
    message: 'Failed to create session',
  },
  FAILED_TO_GET_SESSION: {
    status: 401, // also 500
    message: 'Failed to get session',
  },
  SESSION_EXPIRED: {
    status: 400,
    message: 'Session expired. Re-authenticate to perform this action.',
  },
  SESSION_NOT_FRESH: {
    status: 403,
    message: 'Session is not fresh',
  },

  // --- Credentials / password ---
  INVALID_PASSWORD: {
    status: 400,
    message: 'Invalid password',
  },
  INVALID_EMAIL: {
    status: 400,
    message: 'Invalid email',
  },
  INVALID_EMAIL_OR_PASSWORD: {
    status: 401,
    message: 'Invalid email or password',
  },
  PASSWORD_TOO_SHORT: {
    status: 400,
    message: 'Password too short',
  },
  PASSWORD_TOO_LONG: {
    status: 400,
    message: 'Password too long',
  },
  PASSWORD_ALREADY_SET: {
    status: 400,
    message: 'User already has a password set',
  },

  // --- Email ---
  EMAIL_NOT_VERIFIED: {
    status: 403,
    message: 'Email not verified',
  },
  EMAIL_CAN_NOT_BE_UPDATED: {
    status: 400,
    message: 'Email can not be updated',
  },
  CHANGE_EMAIL_DISABLED: {
    status: 400,
    message: 'Change email is disabled',
  },
  EMAIL_ALREADY_VERIFIED: {
    status: 400,
    message: 'Email is already verified',
  },
  EMAIL_MISMATCH: {
    status: 400,
    message: 'Email mismatch',
  },
  VERIFICATION_EMAIL_NOT_ENABLED: {
    status: 400,
    message: "Verification email isn't enabled",
  },
  FAILED_TO_CREATE_VERIFICATION: {
    status: 500,
    message: 'Unable to create verification',
  },

  // --- Tokens / providers (OAuth / social) ---
  PROVIDER_NOT_FOUND: {
    status: 404,
    message: 'Provider not found',
  },
  INVALID_TOKEN: {
    status: 400, // also 401 / 404 depending on route
    message: 'Invalid token',
  },
  TOKEN_EXPIRED: {
    status: 400,
    message: 'Token expired',
  },
  ID_TOKEN_NOT_SUPPORTED: {
    status: 404,
    message: 'id_token not supported',
  },
  FAILED_TO_GET_USER_INFO: {
    status: 401, // also 404
    message: 'Failed to get user info',
  },

  // --- Origin / callback URLs ---
  INVALID_ORIGIN: {
    status: 403,
    message: 'Invalid origin',
  },
  MISSING_OR_NULL_ORIGIN: {
    status: 403,
    message: 'Missing or null Origin',
  },
  INVALID_CALLBACK_URL: {
    status: 403,
    message: 'Invalid callbackURL',
  },
  INVALID_REDIRECT_URL: {
    status: 403,
    message: 'Invalid redirectURL',
  },
  INVALID_ERROR_CALLBACK_URL: {
    status: 403,
    message: 'Invalid errorCallbackURL',
  },
  INVALID_NEW_USER_CALLBACK_URL: {
    status: 403,
    message: 'Invalid newUserCallbackURL',
  },
  CALLBACK_URL_REQUIRED: {
    status: 400,
    message: 'callbackURL is required',
  },
  CROSS_SITE_NAVIGATION_LOGIN_BLOCKED: {
    status: 403,
    message: 'Cross-site navigation login blocked. This request appears to be a CSRF attack.',
  },

  // --- Request ---
  METHOD_NOT_ALLOWED_DEFER_SESSION_REQUIRED: {
    status: 405,
    message: 'POST method requires deferSessionRefresh to be enabled in session config',
  },
} satisfies ErrorMap;
