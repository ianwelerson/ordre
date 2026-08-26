import { DEFAULT_LOCALE, type Locale, LOCALES } from '../enums/locale.ts';

/** One `Accept-Language` entry: the language tag and the quality value it was weighted with. */
type RankedTag = { tag: string; quality: number };

/**
 * Parses an `Accept-Language` header into its tags, most preferred first.
 *
 * Entries with `q=0` are dropped, because RFC 9110 defines that value as "not
 * acceptable" rather than "least preferred".
 */
const rankTags = (header: string): RankedTag[] =>
  header
    .split(',')
    .map((entry) => {
      const [tag, ...parameters] = entry.trim().split(';');
      const quality = parameters
        .map((parameter) => parameter.trim())
        .find((parameter) => parameter.startsWith('q='));

      return {
        tag: (tag ?? '').trim().toLowerCase(),
        quality: quality ? Number.parseFloat(quality.slice(2)) : 1,
      };
    })
    .filter(({ tag, quality }) => tag !== '' && Number.isFinite(quality) && quality > 0)
    .sort((a, b) => b.quality - a.quality);

/**
 * Picks the best supported locale for an `Accept-Language` header value.
 *
 * Matches a full tag first and then its primary subtag, so `pt-BR` resolves to
 * `pt`. Returns {@link DEFAULT_LOCALE} when the header is absent, malformed, or
 * asks only for locales we do not have.
 *
 * @param header - The raw header value, or `undefined` when the request sent none.
 * @example
 * negotiateLocale('pt-BR,pt;q=0.9,en;q=0.8'); // 'pt'
 */
export const negotiateLocale = (header: string | undefined): Locale => {
  if (!header) {
    return DEFAULT_LOCALE;
  }

  for (const { tag } of rankTags(header)) {
    const primary = tag.split('-')[0];
    const supported = LOCALES.find((locale) => locale === tag || locale === primary);

    if (supported) {
      return supported;
    }
  }

  return DEFAULT_LOCALE;
};
