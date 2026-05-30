import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { globSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { registry } from './openapi-registry.ts';

const controllersDir = path.resolve(import.meta.dirname, '../controllers');

// Auto-import every controller's *.openapi.ts so it registers onto the shared
// registry before the document is generated. Sorted for a stable spec output.
await Promise.all(
  globSync('**/*.openapi.ts', { cwd: controllersDir })
    .sort()
    .map((file) => import(pathToFileURL(path.join(controllersDir, file)).href))
);

const generator = new OpenApiGeneratorV3(registry.definitions);

// Generate the OpenAPI docs
export const openApiSpec: ReturnType<OpenApiGeneratorV3['generateDocument']> =
  generator.generateDocument({
    openapi: '3.0.0',
    info: {
      title: 'Ordre API',
      version: '1.0.0',
      description: 'REST API for the Ordre client communication platform.',
      contact: {
        name: 'Ordre',
        url: 'https://ordre.app',
        email: 'devops@ordre.app',
      },
    },
    servers: [
      { url: 'https://api.ordre.app', description: 'Production' },
      { url: 'https://ordre-api.vercel.app', description: 'Development' },
    ],
  });
