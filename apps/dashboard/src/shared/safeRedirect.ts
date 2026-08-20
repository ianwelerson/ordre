/**
 * Narrows an untrusted `?next=` value down to a path this app can redirect to.
 *
 * The value arrives from the query string, so it is attacker-controlled and a
 * bare `startsWith('/')` check is not enough: `//evil.com` is a protocol-relative
 * URL that navigates off-site, and `'\'` parses as `'/'` in URLs, so `/\evil.com`
 * is one too. Resolving against a throwaway origin normalises every variant at
 * once, which is why this parses rather than pattern-matches.
 *
 * Only `pathname` and `search` survive, so a trailing `#fragment` is dropped
 * along the way. Anything absent, relative, or off-origin falls back to `'/'`.
 *
 * @param next - The raw `next` query parameter, or `null` when it is absent.
 * @returns An app-relative path with its query string, or `'/'` when `next` cannot be trusted.
 */
export const safeRedirect = (next: string | null): string => {
  if (!next?.startsWith('/')) {
    return '/';
  }

  const resolved = new URL(next, 'https://internal');

  return resolved.origin === 'https://internal' ? `${resolved.pathname}${resolved.search}` : '/';
};
