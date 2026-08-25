import { createServices } from '@ordre/services';

const baseUrl = process.env.NEXT_PUBLIC_API_URL;

if (!baseUrl) {
  throw new Error('NEXT_PUBLIC_API_URL is not set');
}

/**
 * The app's single configured service surface. Import this rather than
 * `createServices`, so no call site carries a base URL.
 */
export const services = createServices({ baseUrl });
