import { registry } from '#/config/openapi-registry.ts';

import { API_ROUTES } from '@ordre/core/constants';
import { FeaturesSchema } from '@ordre/core/schemas';

registry.registerPath({
  method: 'get',
  path: API_ROUTES.features,
  operationId: 'getFeatures',
  tags: ['Features'],
  summary: 'List the feature switches',
  responses: {
    200: {
      description: 'Every feature switch and whether it is on',
      content: { 'application/json': { schema: FeaturesSchema } },
    },
  },
});
