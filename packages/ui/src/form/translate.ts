/**
 * The one thing this package cannot supply for itself.
 *
 * The apps do not share an i18n runtime - the Next apps use `next-intl`, the
 * board uses `i18next` - so a shared form layer cannot call a translation hook
 * and still serve all three. It takes the resolved function instead, and each
 * app passes its own at the call site.
 *
 * Keys are absolute (`errors.NETWORK_ERROR`, `validation.email`), so the caller
 * must pass an unscoped translator, not one bound to a namespace.
 */
export type Translate = (key: string) => string;
