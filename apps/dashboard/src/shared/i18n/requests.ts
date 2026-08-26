import { getRequestConfig } from 'next-intl/server';
import { headers } from 'next/headers';

import { negotiateLocale } from '@ordre/core/messages';

/**
 * Resolves the request's locale from `Accept-Language` and loads its message
 * bundles.
 *
 * Negotiation goes through `@ordre/core` rather than being done here, so this and
 * the API resolve the same header to the same locale. The API freezes its answer
 * into outbox rows, and a mail that disagreed with the page that triggered it
 * would be a bug neither side could see alone.
 */
export default getRequestConfig(async () => {
  const store = await headers();
  const locale = negotiateLocale(store.get('accept-language') ?? undefined);

  return {
    locale,
    messages: {
      // Global Messages
      ...(await import(`@ordre/core/messages`))[locale],
      // App Message
      ...(await import(`./messages/${locale}.ts`)).default,
    },
  };
});
