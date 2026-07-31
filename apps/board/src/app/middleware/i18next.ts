import 'i18next';
import { createI18nextMiddleware } from 'remix-i18next';

import { initReactI18next } from 'react-i18next';
import { createCookie } from 'react-router';

import { fallbackLanguage, getLocaleFromPath, supportedLanguages } from '@/app/locale/locales';
import resources from '@/shared/i18n';

export const localeCookie = createCookie('lng', {
  path: '/',
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  httpOnly: true,
});

export const [i18nextMiddleware, getLocale, getInstance] = createI18nextMiddleware({
  detection: {
    supportedLanguages: [...supportedLanguages],
    fallbackLanguage,
    cookie: localeCookie,
    order: ['custom', 'cookie', 'header'],
    async findLocale(request) {
      const url = new URL(request.url);
      return getLocaleFromPath(url.pathname);
    },
  },
  i18next: { resources },
  plugins: [initReactI18next],
});

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: typeof resources.en;
  }
}
