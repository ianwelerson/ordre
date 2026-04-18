import './app.css';

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  data,
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  redirect,
  Scripts,
  ScrollRestoration,
} from 'react-router';

import {
  fallbackLanguage,
  getLocaleFromPath,
  localePrefixes,
  stripLocalePrefix,
  type SupportedLanguage,
} from '@/app/locale/locales';
import { getLocale, i18nextMiddleware, localeCookie } from '@/app/middleware/i18next';

import type { Route } from './+types/root';

export const middleware = [i18nextMiddleware];

export async function loader({ context, request }: Route.LoaderArgs) {
  const locale = getLocale(context) as SupportedLanguage;
  const url = new URL(request.url);
  const pathLocale = getLocaleFromPath(url.pathname) ?? fallbackLanguage;

  if (pathLocale !== locale) {
    const basePath = stripLocalePrefix(url.pathname);
    const expectedPrefix = localePrefixes[locale];
    const destination = expectedPrefix + (basePath === '/' && expectedPrefix ? '' : basePath);
    throw redirect(destination + url.search, {
      headers: { 'Set-Cookie': await localeCookie.serialize(locale) },
    });
  }

  return data({ locale }, { headers: { 'Set-Cookie': await localeCookie.serialize(locale) } });
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation();

  return (
    <html lang={i18n.language} dir={i18n.dir(i18n.language)}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App({ loaderData }: Route.ComponentProps) {
  const { i18n } = useTranslation();
  const { locale } = loaderData;

  useEffect(() => {
    if (i18n.language !== locale) i18n.changeLanguage(locale);
  }, [locale, i18n]);

  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = 'Oops!';
  let details = 'An unexpected error occurred.';
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404' : 'Error';
    details =
      error.status === 404 ? 'The requested page could not be found.' : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="container mx-auto p-4 pt-16">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full overflow-x-auto p-4">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
