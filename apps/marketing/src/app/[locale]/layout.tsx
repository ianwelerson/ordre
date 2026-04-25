import './globals.css';

import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations();

  return {
    title: t('app.name'),
    description: t('app.tagline'),
    icons: {
      icon: [
        { url: '/icon-white.ico', media: '(prefers-color-scheme: light)' },
        { url: '/icon-dark.ico', media: '(prefers-color-scheme: dark)' },
      ],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): Promise<React.ReactElement> {
  const locale = await getLocale();

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider locale={locale}>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
