import { z } from 'zod';

import { type Feature, FEATURES } from '../enums/feature.ts';

/**
 * One boolean per feature, keyed by the feature name.
 *
 * The shape is derived from `FEATURES` so the two can never drift; the cast is
 * what tells the compiler the derived record covers every key.
 */
const featureShape = Object.fromEntries(FEATURES.map((key) => [key, z.boolean()])) as {
  [K in Feature]: z.ZodBoolean;
};

/** Every feature switch and whether it is on, as the API returns it. */
export const FeaturesSchema = z.object(featureShape);
