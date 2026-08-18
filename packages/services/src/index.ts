import { createAuthService } from './auth/auth.service.ts';
import { createHttpClient, type HttpClientOptions } from './http/client.ts';

export type Services = ReturnType<typeof createServices>;

/**
 * Builds the service surface for one API origin. Apps call this once, in a
 * single module, and import that module everywhere else - so no call site ever
 * carries a base URL.
 */
export const createServices = (options: HttpClientOptions) => {
  const http = createHttpClient(options);

  return {
    auth: createAuthService(http),
  };
};
