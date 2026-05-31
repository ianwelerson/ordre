export const appName = 'Ordre Docs';

// Guide documentation lives under /internal-docs, the API reference under /api-docs.
// The root (/) redirects to the Ordre marketing site.
export const docsRoute = '/internal-docs';
export const apiDocsRoute = '/api-docs';
export const docsImageRoute = '/og/docs';
export const docsContentRoute = '/llms.mdx/docs';

// Marketing site URL, resolved per environment (Vercel sets VERCEL_ENV).
export function marketingUrl(): string {
  switch (process.env.VERCEL_ENV) {
    case 'production':
      return 'https://ordre.app';
    case 'preview':
      return 'https://ordre-marketing.vercel.app';
    default:
      return 'https://ordre.localhost';
  }
}
