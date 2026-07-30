import { registry } from '#/config/openapi-registry.ts';

import { healthPath } from './index.ts';

registry.registerPath({
  method: 'get',
  path: healthPath,
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
