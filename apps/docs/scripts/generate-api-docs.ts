import { generateFiles } from 'fumadocs-openapi';
import { createOpenAPI } from 'fumadocs-openapi/server';
import { rmSync } from 'node:fs';

// Generate MDX pages for the API reference from public/openapi.json
// (itself generated from apps/api via `pnpm api:docs:generate`).
// One page per operation, written into content/api-docs.
const output = './content/api-docs';

const openapi = createOpenAPI({
  input: ['./public/openapi.json'],
  // Don't cache the parsed schema so `--watch` picks up spec changes.
  disableCache: true,
});

// Start from a clean slate so operations removed from the spec don't leave
// stale pages behind.
rmSync(output, { recursive: true, force: true });

await generateFiles({
  input: openapi,
  output,
  per: 'operation',
  // Passed `--watch` by `docs:dev:app`: regenerate when the spec changes.
  watch: process.argv.includes('--watch'),
});
