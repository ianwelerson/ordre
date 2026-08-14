import { getDb } from '#/config/db-context.ts';
import { db } from '#/config/db.ts';
import { logger } from '#/config/logger.ts';
import { appOrigins, urls } from '#/config/urls.ts';
import { pushToOutbox } from '#/utils/outbox.ts';
import { parseBetterAuthValidationDetails } from '#/utils/validation.ts';
import { env } from '#env';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { APIError, createAuthMiddleware, isAPIError } from 'better-auth/api';
import { openAPI } from 'better-auth/plugins';

import { API_BASE_PATH, API_ROUTES } from '@ordre/core/constants';
import { AUTH_ERRORS, BASE_ERRORS, VALIDATION_ERRORS } from '@ordre/core/errors';
import type { ErrorMap } from '@ordre/core/types';
import * as schema from '@ordre/db/schemas';

/**
 * Our error catalog keyed by Better Auth's error `code`. The `after` hook below
 * uses it to replace Better Auth's status/message with our own version while
 * keeping the `code` so the client can still map it. `BASE_ERRORS` is included
 * for the access codes (`UNAUTHORIZED`, `FORBIDDEN`) Better Auth can also throw.
 */
const ERROR_CATALOG: ErrorMap = { ...BASE_ERRORS, ...AUTH_ERRORS, ...VALIDATION_ERRORS };

/**
 * Remaps a Better Auth API error onto our own catalog definition, keeping the
 * `code` so the client can still map it. Returns `undefined` - meaning "leave
 * Better Auth's response untouched" - when the value isn't a Better Auth API
 * error, carries no string `code`, or the `code` isn't in our catalog.
 *
 * On `VALIDATION_ERROR` it expands Better Auth's flattened message into a
 * per-field `details` map. Exported for unit testing; the `after` hook below
 * throws whatever this returns.
 */
export const remapAuthError = (returned: unknown): APIError | undefined => {
  // Only remap Better Auth API errors that carry a string code.
  if (!isAPIError(returned) || typeof returned.body?.code !== 'string') {
    return undefined;
  }

  const code = returned.body.code;
  const definition = ERROR_CATALOG[code];

  // Unknown code: leave Better Auth's response untouched.
  if (!definition) {
    return undefined;
  }

  // On validation failures Better Auth flattens every field error into the
  // message; expand it back into a per-field map for the client.
  const details =
    code === 'VALIDATION_ERROR' && typeof returned.body.message === 'string'
      ? parseBetterAuthValidationDetails(returned.body.message)
      : undefined;

  return new APIError(definition.status ?? returned.status, {
    code,
    message: definition.message,
    ...(details ? { details } : {}),
  });
};

/**
 * TODO
 *
 * - Create the custom user fields
 */

// Better Auth Configuration
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
  }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: urls.api,
  basePath: `${API_BASE_PATH}${API_ROUTES.auth.base}`,
  trustedOrigins: [...appOrigins],
  advanced: {
    database: {
      generateId: 'uuid', // Set the IDs to be UUID
    },
    cookiePrefix: 'ordre-app',
  },
  emailAndPassword: {
    enabled: true,
  },

  plugins: [
    openAPI({ disableDefaultReference: true }), // We need Better Auth to generate the openAPI specs but not the paths
  ],
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          try {
            await pushToOutbox(getDb(), {
              channel: 'email',
              topic: 'account:created',
              to: user.email,
              variables: { user_name: user.name, user_email: user.email },
            });
          } catch (error) {
            logger.error({ err: error, userId: user.id }, 'failed to queue account:created email');
          }
        },
      },
    },
  },
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      const remapped = remapAuthError(ctx.context.returned);

      if (remapped) {
        throw remapped;
      }
    }),
  },
});
