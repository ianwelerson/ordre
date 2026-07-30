import type { Health, Response } from '@ordre/core/types';

/**
 * Liveness check. Returns 200 with the current timestamp so uptime monitors and
 * load balancers can confirm the API is running.
 *
 * @returns A `Health` response (200).
 */
export const healthController = async (): Promise<Response<Health>> => ({
  status: 200,
  body: {
    ok: true,
    timestamp: new Date().toISOString(),
  },
});
