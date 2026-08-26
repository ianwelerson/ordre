import { createTranslator } from 'use-intl/core';

import type { Locale } from '@ordre/core/enums';
import { emails as en } from '@ordre/core/messages/en';
import { emails as pt } from '@ordre/core/messages/pt';
import type { EmailCopyKey, EmailMessages, EmailSharedCopy } from '@ordre/core/types';

/**
 * Every locale's email copy.
 *
 * Typed `Record<Locale, EmailMessages>`, so adding a locale to `LOCALES` fails to
 * compile until a bundle exists for it.
 */
const MESSAGES: Record<Locale, EmailMessages> = { en, pt };

/**
 * Reads one field of a template's own copy, interpolating any ICU placeholders.
 *
 * Keyed to the block `K` rather than to every field of every message, so asking
 * for a field another message defines is a compile error.
 */
export type Translate<K extends EmailCopyKey> = (
  key: keyof EmailMessages[K],
  values?: Record<string, string>
) => string;

export type Copy<K extends EmailCopyKey> = {
  t: Translate<K>;
  /**
   * The block itself, for content the translator cannot return: the step list is
   * an array, and carries no placeholders to interpolate anyway.
   */
  raw: EmailMessages[K];
  shared: EmailSharedCopy;
};

/**
 * Builds the translator and copy block one template renders from.
 *
 * @param key - Which block to scope to, taken from the template registry.
 * @example
 * const { t, raw } = copyFor('pt', 'inviteCreated');
 * t('heading', { workspace_name: 'Atelier' });
 */
export const copyFor = <K extends EmailCopyKey>(locale: Locale, key: K): Copy<K> => ({
  // use-intl derives its key union from the literal shape of the bundle, and ours
  // is a `Record`, which collapses that inference to `never`. `Translate<K>`
  // states the contract that matters instead: a key of this message's own block,
  // which `EmailMessages` already guarantees exists in every locale.
  t: createTranslator({
    locale,
    messages: MESSAGES[locale],
    namespace: key,
  }) as unknown as Translate<K>,
  raw: MESSAGES[locale][key],
  shared: MESSAGES[locale].shared,
});
