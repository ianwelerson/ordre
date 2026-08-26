/**
 * Canonical value list for the locales the product is translated into.
 *
 * `LOCALES` backs a Postgres enum through `pgEnum`, so adding a value is a
 * migration. It is also the list every message bundle must cover: the bundles in
 * `@ordre/core/messages` are keyed by these values, and a locale with no bundle
 * is a compile error there.
 */
export const LOCALES = ['en', 'pt'] as const;
export type Locale = (typeof LOCALES)[number];

/** The locale used when no preference is known, and the fallback for every negotiation. */
export const DEFAULT_LOCALE: Locale = 'en';
