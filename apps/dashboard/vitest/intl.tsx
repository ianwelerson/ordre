import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';

import en from '@ordre/core/messages/en';

import appMessages from '../src/shared/i18n/messages/en';

/**
 * The English bundle, composed the way `i18n/requests.ts` composes it, so a test
 * reads the copy the app actually ships.
 */
export const messages = { ...en, ...appMessages };

/**
 * Wraps a tree in the app's English messages, for anything that calls
 * `useTranslations`.
 *
 * @example
 * render(withIntl(<InviteWorkspace invite={invite} />));
 */
export const withIntl = (children: ReactNode) => {
  return (
    <NextIntlClientProvider locale="en" messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
};
