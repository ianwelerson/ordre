import { RootProvider } from 'fumadocs-ui/provider/next';

import './global.css';

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://docs.ordre.app'),
  title: {
    default: 'Ordre Docs',
    template: '%s - Ordre Docs',
  },
  description:
    'Internal documentation and API reference for Ordre, a client communication platform for service providers.',
  icons: {
    icon: '/icon-rounded.svg',
  },
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
