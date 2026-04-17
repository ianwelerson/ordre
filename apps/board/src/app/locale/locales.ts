export const supportedLanguages = ['en', 'pt'] as const;

export type SupportedLanguage = (typeof supportedLanguages)[number];

export const fallbackLanguage: SupportedLanguage = 'en';

export const localePrefixes = {
  en: '',
  pt: '/br',
} as const satisfies Record<SupportedLanguage, string>;

export function getLocaleFromPath(pathname: string): SupportedLanguage | null {
  for (const lng of supportedLanguages) {
    const prefix = localePrefixes[lng];
    if (!prefix) {
      continue;
    }

    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return lng;
    }
  }
  return null;
}

export function stripLocalePrefix(pathname: string): string {
  const lng = getLocaleFromPath(pathname);
  if (!lng) {
    return pathname;
  }

  const prefix = localePrefixes[lng];
  const stripped = pathname.slice(prefix.length);

  return stripped === '' ? '/' : stripped;
}
