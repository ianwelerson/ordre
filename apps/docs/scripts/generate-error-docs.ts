import { writeFileSync } from 'node:fs';
import { watch } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import * as errorCatalogs from '@ordre/core/errors';
import { en } from '@ordre/core/messages';
import type { ErrorMap } from '@ordre/core/types';

// Generate a single MDX page documenting every error in the shared catalog,
// grouped by domain (AUTH_ERRORS, VALIDATION_ERRORS, ...). The source of truth
// is @ordre/core/errors, so the page can never drift from the catalog the API
// actually returns. Wired into the docs build alongside generate-api-docs.ts.
const output = './content/docs/architecture/reference/error-codes.mdx';

// `import *` over a workspace package gives the module namespace object - one
// entry per export. Spec guarantees these keys come back sorted, so the group
// order is deterministic across runs. The errors barrel also exports helpers
// (e.g. `errorResponse`), so keep only the `*_ERRORS` catalogs.
const catalogs = Object.fromEntries(
  Object.entries(errorCatalogs as Record<string, unknown>).filter(([name]) =>
    name.endsWith('_ERRORS')
  )
) as Record<string, ErrorMap>;

/** Turns a catalog export name into a page heading (`AUTH_ERRORS` -> `Auth`). */
function groupTitle(exportName: string): string {
  return exportName
    .replace(/_ERRORS$/, '')
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/** Escapes a literal pipe so a message can't break out of its Markdown table column. */
function cell(value: string): string {
  return value.replace(/\|/g, '\\|');
}

/**
 * Renders one error catalog as a Markdown section.
 *
 * The catalog holds only a status - the words live in `@ordre/core/messages`,
 * keyed by the same code - so the message column is resolved from the English
 * copy, which is exactly what the API puts on the wire.
 */
function renderGroup(exportName: string, map: ErrorMap): string {
  const rows = Object.keys(map)
    .map((code) => {
      const status = map[code]?.status ?? '-';
      const copy = en.errors[code as keyof typeof en.errors] ?? '-';

      return `| \`${code}\` | ${status} | ${cell(copy)} |`;
    })
    .join('\n');

  return [
    `## ${groupTitle(exportName)}`,
    '',
    '| Code | Status | Message |',
    '| ---- | ------ | ------- |',
    rows,
  ].join('\n');
}

/** Renders the validation keys, which are a separate vocabulary from the error codes. */
function renderValidation(): string {
  const rows = Object.entries(en.validation)
    .map(([key, copy]) => `| \`validation.${key}\` | ${cell(copy)} |`)
    .join('\n');

  return [
    '## Validation keys',
    '',
    'Field-level failures travel in `details`, keyed by field name. The **value** is one of',
    'these keys rather than a sentence, so each client renders it in its own locale.',
    '',
    '| Key | Message |',
    '| --- | ------- |',
    rows,
  ].join('\n');
}

/** Builds the full MDX page: front matter, intro, and one section per error catalog. */
function render(): string {
  const groups = Object.entries(catalogs)
    .map(([name, map]) => renderGroup(name, map))
    .join('\n\n');

  const validation = renderValidation();

  return `---
title: Error Codes
icon: TriangleAlert
description: Every error code in the shared catalog, with its HTTP status and message.
---

{/* GENERATED FILE - do not edit by hand. Source: packages/core/src/errors. Run \`pnpm docs:errors\` to regenerate. */}

The API returns a stable \`code\` on every error response. The \`code\` is the
contract - branch on it, never on the message text.

The message below is the English copy from \`@ordre/core/messages\`, which is also
what the API puts on the response body. There is one string per code, not two: a
client resolves the **same code** in the reader's own locale under the \`errors\`
namespace, and only falls back to reading \`message\` if it has no copy at all.

Copy is typed as \`Record<ErrorCode, string>\`, so a code added to the catalog
cannot ship until every locale has words for it.

\`CLIENT_ERRORS\` are raised by \`@ordre/services\` itself - a dropped connection,
an unparseable body - and never come from the API. They share the catalog so a
consumer has one vocabulary to map.

${groups}

${validation}
`;
}

/** Renders the page and writes it to `output`. */
function generate(): void {
  writeFileSync(output, render());
  console.log(`Generated ${output}`);
}

generate();

// Passed `--watch` by `docs:dev:app`: regenerate when a catalog source changes.
if (process.argv.includes('--watch')) {
  // Resolve the errors source dir from the package export so the watch path
  // survives the package moving on disk.
  const errorsEntry = fileURLToPath(import.meta.resolve('@ordre/core/errors'));
  const errorsDir = dirname(errorsEntry);

  let queued: NodeJS.Timeout | undefined;
  watch(errorsDir, () => {
    // Debounce: editors fire several events per save.
    clearTimeout(queued);
    queued = setTimeout(generate, 50);
  });
  console.log(`Watching ${errorsDir} for changes`);
}
