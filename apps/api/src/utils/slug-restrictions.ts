// Names the platform needs for routes, subdomains, auth and system endpoints.
// These are never grantable to a workspace.
const RESERVED: string[] = [
  'about',
  'account',
  'accounts',
  'admin',
  'administrator',
  'api',
  'app',
  'apps',
  'auth',
  'billing',
  'blog',
  'careers',
  'cdn',
  'checkout',
  'community',
  'contact',
  'cookies',
  'dashboard',
  'developer',
  'developers',
  'discover',
  'docs',
  'documentation',
  'download',
  'downloads',
  'email',
  'enterprise',
  'explore',
  'faq',
  'feed',
  'files',
  'ftp',
  'help',
  'home',
  'host',
  'hosting',
  'images',
  'img',
  'index',
  'internal',
  'invite',
  'jobs',
  'legal',
  'library',
  'license',
  'licensing',
  'login',
  'logout',
  'mail',
  'me',
  'media',
  'new',
  'news',
  'notifications',
  'oauth',
  'onboarding',
  'order',
  'orders',
  'ordre',
  'partners',
  'password',
  'pay',
  'payment',
  'payments',
  'plans',
  'policy',
  'portal',
  'pricing',
  'privacy',
  'profile',
  'public',
  'register',
  'reset',
  'root',
  'search',
  'security',
  'settings',
  'setup',
  'signin',
  'signup',
  'sitemap',
  'slug',
  'ssl',
  'staff',
  'static',
  'status',
  'store',
  'support',
  'system',
  'team',
  'terms',
  'test',
  'tos',
  'trial',
  'upgrade',
  'user',
  'users',
  'verify',
  'webhook',
  'webhooks',
  'welcome',
  'workspace',
  'workspaces',
  'ws',
  'www',
];

// Well-known brands / trademarks reserved to prevent impersonation and squatting.
// Grantable only to a verified owner (see PROTECTED_SLUG message -> "get in contact with us").
const PROTECTED: string[] = [
  'adidas',
  'adobe',
  'airbnb',
  'amazon',
  'amd',
  'android',
  'apple',
  'aws',
  'bmw',
  'burgerking',
  'cocacola',
  'coca-cola',
  'dell',
  'discord',
  'disney',
  'dropbox',
  'ebay',
  'facebook',
  'ferrari',
  'figma',
  'ford',
  'github',
  'gitlab',
  'google',
  'gucci',
  'honda',
  'hp',
  'huawei',
  'ibm',
  'ikea',
  'instagram',
  'intel',
  'lego',
  'linkedin',
  'louisvuitton',
  'mastercard',
  'mcdonalds',
  'mercedes',
  'meta',
  'microsoft',
  'netflix',
  'nike',
  'nintendo',
  'notion',
  'nvidia',
  'openai',
  'oracle',
  'paypal',
  'pepsi',
  'pinterest',
  'playstation',
  'porsche',
  'reddit',
  'rolex',
  'samsung',
  'sony',
  'spotify',
  'starbucks',
  'stripe',
  'tesla',
  'tiktok',
  'toyota',
  'twitch',
  'twitter',
  'uber',
  'visa',
  'volkswagen',
  'whatsapp',
  'xbox',
  'youtube',
  'zoom',
];

// Strong profanity / slurs matched ANYWHERE in the normalized slug, since they
// almost never appear inside legitimate words. This catches evasions like
// "f-u-c-k", "sh1t" and "n1gger" once the slug is normalized.
const BANNED_SUBSTRING: string[] = [
  'asshole',
  'bastard',
  'bitch',
  'bollocks',
  'bullshit',
  'dildo',
  'douchebag',
  'ejaculate',
  'faggot',
  'fuck',
  'genocide',
  'goddamn',
  'handjob',
  'hentai',
  'hitler',
  'jerkoff',
  'jizz',
  'kkk',
  'motherfuck',
  'nazi',
  'nigga',
  'nigger',
  'pedophile',
  'porn',
  'pussy',
  'shit',
  'slut',
  'tranny',
  'twat',
  'vagina',
  'wanker',
  'whore',
];

// Short / embeddable terms that WOULD cause false positives via substring match
// (e.g. "sex" in "sussex", "anal" in "analytics", "rape" in "grape", "cunt" in
// "scunthorpe", "coon" in "raccoon"). These only match when they make up the
// whole normalized slug or a full separator-delimited segment.
const BANNED_WORDS: string[] = [
  'anal',
  'anus',
  'arse',
  'boob',
  'cock',
  'coon',
  'cracker',
  'cunt',
  'dick',
  'dyke',
  'fag',
  'homo',
  'kike',
  'negro',
  'paki',
  'pedo',
  'penis',
  'prick',
  'rape',
  'rapist',
  'retard',
  'sex',
  'spastic',
  'spic',
  'wank',
];

// Common leetspeak substitutions, mapped back to letters before matching so
// "b1tch" / "sh!t" / "@ss" resolve to their base form.
const LEET_MAP: Record<string, string> = {
  '0': 'o',
  '1': 'i',
  '3': 'e',
  '4': 'a',
  '5': 's',
  '7': 't',
  '8': 'b',
  '9': 'g',
  '@': 'a',
  $: 's',
  '!': 'i',
  '|': 'i',
  '+': 't',
};

/**
 * Lowercases, de-leets, and strips every non-letter, so separators used to smuggle
 * profanity ("f-u-c-k", "f_u_c_k") collapse into a single comparable token.
 */
const normalize = (value: string): string =>
  value
    .toLowerCase()
    .split('')
    .map((char) => LEET_MAP[char] ?? char)
    .join('')
    .replace(/[^a-z]/g, '');

export type SlugRestriction = 'RESERVED' | 'PROTECTED' | 'BANNED';

/**
 * Returns `true` when the normalized slug contains banned profanity. Substring
 * terms match anywhere; short, embeddable terms match only as a whole segment.
 */
const isBanned = (slug: string): boolean => {
  const normalized = normalize(slug);

  if (BANNED_SUBSTRING.some((term) => normalized.includes(term))) {
    return true;
  }

  // Match short terms as the whole slug or as a full delimited segment only,
  // so "my-sex-shop" is blocked but "sussex" is not.
  const segments = slug
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map(normalize);

  return BANNED_WORDS.some((term) => normalized === term || segments.includes(term));
};

/**
 * Classifies a slug against the platform's restriction lists.
 *
 * Checks in priority order: `RESERVED` (platform/system names), `PROTECTED`
 * (known brands, grantable only to a verified owner), then `BANNED` (profanity /
 * slurs, matched after leetspeak normalization). Expects an already-normalized
 * slug (lowercase, hyphenated).
 *
 * @param slug - The normalized workspace slug to check.
 * @returns The matched restriction, or `null` when the slug is allowed.
 */
export const getSlugRestriction = (slug: string): SlugRestriction | null => {
  if (RESERVED.includes(slug)) {
    return 'RESERVED';
  }

  if (PROTECTED.includes(slug)) {
    return 'PROTECTED';
  }

  if (isBanned(slug)) {
    return 'BANNED';
  }

  return null;
};
