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
  // Group operations by their `tags` (Auth, Workspace, Health) into one flat
  // section each, instead of nesting by URL path. This relies on every operation
  // having an `operationId` (fumadocs uses it for the flat page name and would
  // otherwise fall back to a nested route path) - the spec generation in
  // apps/api backfills one for any auth operation better-auth leaves without.
  groupBy: 'tag',
  // Passed `--watch` by `docs:dev:app`: regenerate when the spec changes.
  watch: process.argv.includes('--watch'),
});
