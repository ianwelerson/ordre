import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'pt'],
  defaultLocale: 'en',
  localePrefix: {
    mode: 'as-needed',
    prefixes: {
      pt: '/br',
    },
  },
});
