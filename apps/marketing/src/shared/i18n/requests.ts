import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';

import { app } from '@ordre/i18n/messages';

import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: {
      // Global Messages
      ...app,
      ...(await import(`@ordre/i18n/messages`))[locale],
      // App Message
      ...(await import(`./messages/${locale}.ts`)).default,
    },
  };
});
