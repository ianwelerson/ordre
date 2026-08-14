import { registry } from '#/config/openapi-registry.ts';

import { API_ROUTES } from '@ordre/core/constants';

registry.registerPath({
  method: 'get',
  path: API_ROUTES.health,
  operationId: 'healthCheck',
  tags: ['Health'],
  summary: 'Check health status',
  responses: {
    200: {
      description: 'The service is healthy',
      content: { 'application/json': { schema: {} } },
    },
  },
});
