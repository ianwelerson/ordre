import type { ErrorMap } from '../types/index.ts';
import { AUTH_ERRORS } from './auth.ts';
import { BASE_ERRORS } from './base.ts';
import { BILLING_ERRORS } from './billing.ts';
import { CLIENT_ERRORS } from './client.ts';
import { INVITE_ERRORS } from './invite.ts';
import { LOCATION_ERRORS } from './location.ts';
import { MEMBER_ERRORS } from './member.ts';
import { VALIDATION_ERRORS } from './validation.ts';
import { WORKSPACE_ERRORS } from './workspace.ts';

/**
 * Every error code the system can produce, in one object.
 *
 * The per-domain maps stay the authoring surface - that is where a code is
 * declared and documented. This is the reading surface, for the consumers that
 * need the whole vocabulary rather than one slice of it:
 *
 * - `@ordre/core/messages` types its copy as `Record<ErrorCode, string>`, so a new code
 *   fails the build until every locale has words for it
 * - the API remaps Better Auth's raw codes onto our definitions
 * - the OpenAPI generator resolves a code to prose for the reference
 *
 * Keys are unique across the domain maps, so the spread is a merge and never a
 * silent overwrite.
 */
export const ERROR_CATALOG = {
  ...BASE_ERRORS,
  ...AUTH_ERRORS,
  ...VALIDATION_ERRORS,
  ...WORKSPACE_ERRORS,
  ...LOCATION_ERRORS,
  ...MEMBER_ERRORS,
  ...INVITE_ERRORS,
  ...BILLING_ERRORS,
  ...CLIENT_ERRORS,
} satisfies ErrorMap;

/**
 * Every code in the catalog, as a union.
 *
 * This is what makes the catalog a single source of truth rather than a
 * convention: anything that has to cover all the codes - copy, docs - can be
 * typed against it and will stop compiling when a code is added.
 */
export type ErrorCode = keyof typeof ERROR_CATALOG;
