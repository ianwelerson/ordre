import { getFeatures } from '#/services/feature.ts';

import type { Features, Response } from '@ordre/core/types';

/**
 * Returns every feature switch and whether it is on.
 *
 * Unauthenticated, because the apps read it to decide whether to offer a surface
 * before anyone has signed in.
 *
 * @returns A `Features` response (200).
 */
export const featureGetAll = async (): Promise<Response<Features>> => ({
  status: 200,
  body: await getFeatures(),
});
