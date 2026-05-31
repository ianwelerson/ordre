import { createOpenAPI } from 'fumadocs-openapi/server';

// The spec is generated from apps/api into public/openapi.json
// (see `pnpm api:docs:generate`).
export const openapi = createOpenAPI({
  input: ['./public/openapi.json'],
});
