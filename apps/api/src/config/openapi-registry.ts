import { extendZodWithOpenApi, OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

// Add the `.openapi()` method to the shared zod instance so schemas (including
// those in @ordre/core) can be registered and referenced. Runs once at import;
// the monorepo resolves a single zod, so this patches every schema's prototype.
extendZodWithOpenApi(z);

// Shared registry that every controller's *.openapi.ts registers onto.
export const registry: OpenAPIRegistry = new OpenAPIRegistry();
