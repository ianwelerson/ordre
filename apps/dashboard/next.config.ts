import { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

/**
 * Headers every response carries.
 *
 * `Referrer-Policy` is the one that earns its place: this app serves
 * `/invite/:token` and `/set-password?token=`, so a path leaving in a `Referer`
 * header hands a working credential to whatever the page linked out to. Browsers
 * already default to this value; stating it means the app does not depend on
 * that staying true.
 */
const SECURITY_HEADERS = [
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
];

const nextConfig: NextConfig = {
  headers: async () => [{ source: '/:path*', headers: SECURITY_HEADERS }],
};

const withNextIntl = createNextIntlPlugin('./src/shared/i18n/requests.ts');

export default withNextIntl(nextConfig);
