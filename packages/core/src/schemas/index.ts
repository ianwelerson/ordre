import { installValidationErrorMap } from './error-map.ts';

// Side effect on import, deliberately: every schema below is authored without
// messages, so they only produce translation keys once this is installed. Doing
// it here means importing a schema is enough.
installValidationErrorMap();

/**
 * Zod itself, re-exported.
 *
 * A consumer that needs to build its own schema - a form extending one of the
 * ones below, say - imports `z` from here rather than declaring `zod` of its
 * own. Two copies of zod would be two module instances, and the validation error
 * map is installed on one of them: the second would silently emit English
 * sentences where the first emits translation keys. Nothing type-checks
 * differently, so the bug would only ever show up as untranslated text.
 *
 * One import specifier for the whole repo means that cannot happen. The
 * exception is `apps/api`, which keeps its own `zod` because
 * `@asteasolutions/zod-to-openapi` requires it as a peer.
 */
export { z } from 'zod';

export { validationKeyFor, VALIDATION_KEYS, type ValidationKey } from './error-map.ts';

export * from './response.ts';
export * from './workspace.ts';
export * from './billing.ts';
export * from './outbox.ts';
export * from './auth.ts';
