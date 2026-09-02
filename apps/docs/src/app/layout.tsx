import { RootProvider } from 'fumadocs-ui/provider/next';

import './global.css';

import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
});

// The brand headline face, for the logo specimens on the Brand page.
const headline = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['700'],
  variable: '--font-headline',
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
    <html lang="en" className={`${inter.className} ${headline.variable}`} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
