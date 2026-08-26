import { AsyncLocalStorage } from 'node:async_hooks';

import { DEFAULT_LOCALE, type Locale } from '@ordre/core/enums';

/** What every request carries regardless of whether anyone is signed in. */
type RequestContext = { locale: Locale };

const storage = new AsyncLocalStorage<RequestContext>();

/**
 * The locale negotiated for the in-flight request.
 *
 * Deliberately a separate store from the one in `db-context.ts`: that one is
 * opened by `runWithUser` and therefore only exists for authenticated requests,
 * while the `account:*` emails are produced during sign-up and password reset,
 * where nobody is signed in yet.
 *
 * @returns The request's locale, or {@link DEFAULT_LOCALE} outside a request -
 *   a script, a test, or a background worker.
 */
export const getRequestLocale = (): Locale => storage.getStore()?.locale ?? DEFAULT_LOCALE;

/** Runs `fn` with `locale` readable through {@link getRequestLocale} for its whole async chain. */
export const runWithLocale = <T>(locale: Locale, fn: () => T): T => storage.run({ locale }, fn);
