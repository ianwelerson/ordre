import { match } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';

import { getRequestConfig } from 'next-intl/server';
import { headers } from 'next/headers';

/**
 * Define the user locale based on the headers and return the locale and messages
 */
export default getRequestConfig(async () => {
  const store = await headers();
  const languages = new Negotiator({ headers: Object.fromEntries(store.entries()) }).languages();
  const locales = ['en', 'pt'] as const;
  const defaultLocale = 'en';

  const locale = match(languages, [...locales], defaultLocale) as (typeof locales)[number];

  return {
    locale,
    messages: {
      // Global Messages
      ...(await import(`@ordre/i18n/messages`))[locale],
      // App Message
      ...(await import(`./messages/${locale}.ts`)).default,
    },
  };
});
