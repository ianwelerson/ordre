import { z } from 'zod';

import { FeaturesSchema } from '../schemas/feature.ts';

export type Features = z.infer<typeof FeaturesSchema>;
