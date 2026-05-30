import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';

// Shared registry that every controller's *.openapi.ts registers onto.
export const registry: OpenAPIRegistry = new OpenAPIRegistry();
