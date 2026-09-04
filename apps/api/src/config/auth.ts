import { CLIENT_IP_HEADER } from '#/adapters/express/middlewares/client-ip.ts';
import { getDb } from '#/config/db-context.ts';
import { db } from '#/config/db.ts';
import { logger } from '#/config/logger.ts';
import { appOrigins, cookieDomain, urls } from '#/config/urls.ts';
import { isFeatureEnabled } from '#/services/feature.ts';
import { pushToOutbox } from '#/utils/outbox.ts';
import { parseBetterAuthValidationDetails } from '#/utils/validation.ts';
import { env } from '#env';
import { dash } from '@better-auth/infra';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { APIError, createAuthMiddleware, isAPIError } from 'better-auth/api';
import { openAPI } from 'better-auth/plugins';
import { z } from 'zod';

import { API_BASE_PATH, API_ROUTES, SESSION_COOKIE_PREFIX } from '@ordre/core/constants';
import type { AudienceTopic, Feature } from '@ordre/core/enums';
import {
  AUTH_ERRORS,
  BASE_ERRORS,
  errorMessage,
  FEATURE_DISABLED,
  FEATURE_ERRORS,
  VALIDATION_ERRORS,
} from '@ordre/core/errors';
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
 * The field an alert rule keys off, so one rule covers every producer below
 * rather than three fragile matches on message text.
 */
const OUTBOX_PUSH_FAILED = 'outbox.push_failed';

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
    // Better Auth requires a message on its error body, so the wire keeps one.
    // English, from the shared copy - a client renders its own locale off `code`.
    message: errorMessage(code),
    ...(details ? { details } : {}),
  });
};

/** The shape the sign-up defaulting below needs, and nothing more. */
type SignUpContext = { path: string; body?: { callbackURL?: string } };

/**
 * Gives a sign-up somewhere to land once the emailed link is verified.
 *
 * Better Auth defaults `callbackURL` to `"/"`, which the browser resolves
 * against the *API* origin - so verification succeeds and then drops the visitor
 * on this service's 404. Defaulted here rather than at the call site so no caller
 * can forget, and mutated rather than returned because `ctx.body` is the same
 * object the endpoint goes on to read.
 *
 * Exported for unit testing; the `before` hook below is its only caller.
 */
export const defaultSignUpCallbackUrl = (ctx: SignUpContext): void => {
  if (ctx.path !== '/sign-up/email' || !ctx.body || ctx.body.callbackURL) {
    return;
  }

  ctx.body.callbackURL = urls.dashboard;
};

/** The shape the reset defaulting below needs, and nothing more. */
type PasswordResetContext = { path: string; body?: { redirectTo?: string } };

/**
 * Points the emailed reset link at the dashboard's set-password screen.
 *
 * Overwritten rather than defaulted: the address of a page this service mails
 * people to is the API's to decide, and a browser that supplies its own only
 * gets as far as Better Auth's `trustedOrigins` check anyway. Mutated rather
 * than returned because `ctx.body` is the same object the endpoint goes on to
 * read.
 *
 * Exported for unit testing; the `before` hook below is its only caller.
 */
export const defaultPasswordResetRedirect = (ctx: PasswordResetContext): void => {
  if (ctx.path !== '/request-password-reset' || !ctx.body) {
    return;
  }

  ctx.body.redirectTo = urls.setPassword;
};

/**
 * Joins the two name parts into the single `name` column Better Auth stores.
 *
 * @returns Both parts separated by a space, or whichever one is set.
 */
export const composeName = (firstName: string, lastName: string): string => {
  return [firstName, lastName].filter(Boolean).join(' ');
};

/**
 * Reads one of the two name fields off a Better Auth user, as a string.
 *
 * The database hooks type the user as the base model, so the fields declared in
 * `additionalFields` arrive as `unknown` and have to be narrowed before use.
 */
const nameField = (user: Record<string, unknown>, field: 'firstName' | 'lastName'): string => {
  const value = user[field];

  return typeof value === 'string' ? value : '';
};

/**
 * The topics a brand new account has opted into.
 *
 * Only the checkbox on the sign-up form can produce one. `workspace-updates` is
 * never written here: it defaults to opt-in in Resend, so a contact is already
 * subscribed and the preference is theirs to change.
 */
const signUpTopics = (user: Record<string, unknown>): AudienceTopic[] => {
  return user.productNewsOptIn === true ? ['product-news'] : [];
};

/**
 * The Better Auth dashboard integration, mounted only when an API key is set.
 *
 * `dash()` falls back to an empty `apiKey`, so without this guard an environment
 * with no key still mounts every dashboard endpoint.
 */
const dashPlugins = env.BETTER_AUTH_API_KEY ? [dash({ apiKey: env.BETTER_AUTH_API_KEY })] : [];

/** The shape the auth guard below needs, and nothing more. */
type AuthPathContext = { path: string };

/**
 * The feature each guarded Better Auth path belongs to.
 *
 * A path this map does not name is served without a switch check, so closing
 * `login` stops new sign-ins while the sessions already issued keep working.
 */
const AUTH_PATH_FEATURES: Record<string, Feature> = {
  '/sign-in/email': 'login',
  '/sign-up/email': 'registration',
};

/**
 * Refuses a Better Auth request whose feature is switched off.
 *
 * Better Auth owns every path under `/auth`, so the switch check for these
 * endpoints belongs in its hook. The thrown `APIError` carries a code from our
 * catalog, so a client maps it as it maps any other refusal.
 *
 * Exported for unit testing; the `before` hook below is its only caller.
 */
export const guardAuthFeature = async (ctx: AuthPathContext): Promise<void> => {
  const key = AUTH_PATH_FEATURES[ctx.path];

  if (!key || (await isFeatureEnabled(key))) {
    return;
  }

  const code = FEATURE_DISABLED[key];

  throw new APIError(FEATURE_ERRORS[code].status, { code, message: errorMessage(code) });
};

// Better Auth Configuration
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
  }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: urls.api,
  appName: `Ordre - ${env.APP_STAGE}`,
  basePath: `${API_BASE_PATH}${API_ROUTES.auth.base}`,
  trustedOrigins: [...appOrigins],
  advanced: {
    database: {
      generateId: 'uuid', // Set the IDs to be UUID
      joins: true,
    },
    cookiePrefix: SESSION_COOKIE_PREFIX,
    crossSubDomainCookies: {
      enabled: true,
      domain: cookieDomain,
    },
    /**
     * Read the address Express resolved, rather than re-parsing the forwarded
     * chain here. Better Auth's own parser rejects any chain longer than one
     * entry unless it is told which proxies to trust, and an unresolved IP puts
     * every caller in one shared rate-limit bucket - see `client-ip.ts` for why
     * that is a lockout anyone can trigger. This is also what gives a session
     * row a real `ipAddress`.
     */
    ipAddress: {
      ipAddressHeaders: [CLIENT_IP_HEADER],
    },
  },
  user: {
    additionalFields: {
      firstName: { type: 'string', required: true, validator: { input: z.string().min(1) } },
      lastName: { type: 'string', required: true, validator: { input: z.string().min(1) } },
      // The record that the person agreed to product news, kept because consent has
      // to be provable later, not only acted on once.
      productNewsOptIn: { type: 'boolean', required: false, defaultValue: false },
    },
  },
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      try {
        await pushToOutbox(getDb(), {
          channel: 'email',
          topic: 'account:reset-password',
          to: user.email,
          variables: { user_email: user.email, reset_url: url },
        });
      } catch (error) {
        logger.error(
          {
            err: error,
            userId: user.id,
            event: OUTBOX_PUSH_FAILED,
            topic: 'account:reset-password',
          },
          'failed to queue account:reset-password email'
        );
      }
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    // Increase the expire due to the sendAfter + Outbox Sweep
    expiresIn: 24 * 60 * 60,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      try {
        await pushToOutbox(getDb(), {
          channel: 'email',
          topic: 'account:verify-email',
          to: user.email,
          variables: { user_email: user.email, verify_url: url },
          /**
           * When this mail becomes eligible to send, rather than immediately.
           *
           * Verifying is not required to sign in, so it has no business landing in
           * the same breath as the welcome message and competing with it for the click.
           */
          sendAfter: new Date(Date.now() + 30 * 60 * 1000),
        });
      } catch (error) {
        logger.error(
          { err: error, userId: user.id, event: OUTBOX_PUSH_FAILED, topic: 'account:verify-email' },
          'failed to queue account:verify-email email'
        );
      }
    },
  },

  plugins: [
    openAPI({ disableDefaultReference: true }), // We need Better Auth to generate the openAPI specs but not the paths
    ...dashPlugins,
  ],
  databaseHooks: {
    user: {
      create: {
        // `name` is derived rather than supplied: whatever the client sent is
        // replaced by the two fields the account is actually keyed on.
        before: async (user) => {
          const name = composeName(nameField(user, 'firstName'), nameField(user, 'lastName'));

          return { data: { ...user, name: name || user.name } };
        },
        after: async (user) => {
          try {
            await pushToOutbox(getDb(), {
              channel: 'email',
              topic: 'account:created',
              to: user.email,
              variables: {
                user_name: user.name,
                user_email: user.email,
                dashboard_login_url: urls.dashboardLogin,
              },
            });
          } catch (error) {
            logger.error(
              { err: error, userId: user.id, event: OUTBOX_PUSH_FAILED, topic: 'account:created' },
              'failed to queue account:created email'
            );
          }

          try {
            await pushToOutbox(getDb(), {
              channel: 'audience',
              topic: 'contact:sync',
              to: user.email,
              variables: {
                contact_first_name: nameField(user, 'firstName'),
                contact_last_name: nameField(user, 'lastName'),
                // A new account belongs to no workspace yet, so the only segment it
                // can be in is the one every contact belongs to.
                contact_segments: ['all-accounts'],
                contact_topics: signUpTopics(user),
              },
            });
          } catch (error) {
            logger.error(
              { err: error, userId: user.id, event: OUTBOX_PUSH_FAILED, topic: 'contact:sync' },
              'failed to queue contact:sync row'
            );
          }
        },
      },
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      await guardAuthFeature(ctx);

      defaultSignUpCallbackUrl(ctx);
      defaultPasswordResetRedirect(ctx);
    }),
    after: createAuthMiddleware(async (ctx) => {
      const remapped = remapAuthError(ctx.context.returned);

      if (remapped) {
        throw remapped;
      }
    }),
  },
});
