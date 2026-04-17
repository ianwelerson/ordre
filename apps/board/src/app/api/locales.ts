import { data } from 'react-router';

import { type SupportedLanguage, supportedLanguages } from '@/app/locale/locales';
import resources from '@/shared/i18n';

import type { Route } from './+types/locales';

function isSupportedLanguage(value: string | undefined): value is SupportedLanguage {
  return !!value && (supportedLanguages as readonly string[]).includes(value);
}

export async function loader({ params }: Route.LoaderArgs) {
  const { lng, ns } = params;

  if (!isSupportedLanguage(lng)) {
    return data({ error: `Unsupported language: ${lng}` }, { status: 400 });
  }

  const languageResources = resources[lng] as Record<string, unknown>;

  if (!ns || !(ns in languageResources)) {
    return data({ error: `Unknown namespace: ${ns}` }, { status: 400 });
  }

  return data(languageResources[ns]);
}
