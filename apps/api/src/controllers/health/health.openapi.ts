import { registry } from '#/config/openapi-registry.ts';

import { healthPath } from './index.ts';

registry.registerPath({
  method: 'get',
  path: healthPath,
  summary: 'Check health status',
  responses: {
    200: {
      description: 'Board created',
      content: { 'application/json': { schema: {} } },
    },
  },
});
