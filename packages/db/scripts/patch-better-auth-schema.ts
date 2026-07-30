/**
 * Post-processes the Better Auth schema artifact (`src/schemas/better-auth.ts`).
 *
 * The Better Auth CLI emits that file and offers no switches for the conventions
 * below, so this runs immediately after it (see the `auth:generate` script in
 * `apps/api/package.json`) and rewrites the output in place. Editing the artifact
 * by hand is not an option - the next regenerate would silently drop the fixes,
 * and a `timestamp` that lost its time zone is not the kind of bug that surfaces
 * quickly.
 *
 * Every rule is idempotent (re-running changes nothing) and generic (keyed off
 * shapes, not off the four tables that exist today), so enabling a Better Auth
 * plugin that adds tables does not mean revisiting this file.
 *
 * Rules must also tolerate the generator's own formatting, not ours: this runs
 * on raw output, before Prettier does. The CLI emits double quotes, so matching
 * only the single quotes seen in the committed file silently matches nothing.
 *
 * If a rule matches nothing, the script exits non-zero rather than shrugging:
 * silence would mean the generator's output changed and the guarantees here
 * quietly stopped applying.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCHEMA_PATH = join(dirname(fileURLToPath(import.meta.url)), '../src/schemas/better-auth.ts');

type Rule = {
  name: string;
  /** Rewrites the source. Returns the new source and how many sites it changed. */
  apply: (source: string) => { source: string; changed: number };
  /** Runs on the result; a non-empty return fails the script. */
  verify: (source: string) => string | null;
};

const RULES: Rule[] = [
  {
    // Bare `timestamp` is `timestamp without time zone`: Postgres drops the UTC
    // offset on write, so the value it hands back depends on the connection's
    // `TimeZone`. Session and token expiry cannot afford that ambiguity.
    name: 'timestamps are timezone-aware',
    apply: (source) => {
      let changed = 0;
      const next = source.replace(
        /\btimestamp\((['"])([a-z0-9_]+)\1(?:,\s*\{([^}]*)\})?\)/g,
        (whole, quote: string, column: string, config: string | undefined) => {
          if (config?.includes('withTimezone')) {
            return whole;
          }

          changed += 1;
          // Keep whatever else the generator configured; only add the zone.
          const merged = config?.trim()
            ? `withTimezone: true, ${config.trim()}`
            : 'withTimezone: true';

          return `timestamp(${quote}${column}${quote}, { ${merged} })`;
        }
      );
      return { source: next, changed };
    },
    verify: (source) => {
      // The invariant is "no timestamp column lacks a zone", so check every
      // `timestamp(...)` call rather than only the bare-argument shape.
      const zoneless = [...source.matchAll(/\btimestamp\(([^)]*)\)/g)]
        .map((match) => match[0])
        .filter((call) => !call.includes('withTimezone: true'));

      return zoneless.length > 0 ? `still zone-less: ${zoneless.join(', ')}` : null;
    },
  },
  {
    // The generator marks `updated_at` NOT NULL but only sometimes gives it a
    // default, so an INSERT that doesn't set it explicitly fails on those tables.
    // `.$onUpdate()` only covers UPDATEs - it does nothing on first insert.
    name: 'updatedAt defaults to now()',
    apply: (source) => {
      let changed = 0;
      const next = source.replace(
        /(\bupdatedAt: timestamp\([^)]*\))(\s*)\.\$onUpdate\(/g,
        (_, column: string, gap: string) => {
          changed += 1;
          return `${column}${gap}.defaultNow()${gap}.$onUpdate(`;
        }
      );
      return { source: next, changed };
    },
    verify: (source) => {
      const missing = source.match(/\bupdatedAt: timestamp\([^)]*\)\s*\.\$onUpdate\(/g);
      return missing ? `updatedAt without a default: ${missing.length} site(s)` : null;
    },
  },
  {
    // The generator builds index names from the camelCase *property* name
    // (`session_userId_idx`); every hand-written index in this schema is named
    // after the snake_case column instead.
    name: 'index names are snake_case',
    apply: (source) => {
      let changed = 0;
      const next = source.replace(
        /\bindex\((['"])([A-Za-z0-9_]+)\1\)/g,
        (whole, quote: string, name: string) => {
          const snake = name.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();

          if (snake === name) {
            return whole;
          }

          changed += 1;

          return `index(${quote}${snake}${quote})`;
        }
      );
      return { source: next, changed };
    },
    verify: (source) => {
      const camel = source.match(/\bindex\((['"])[A-Za-z0-9_]*[A-Z][A-Za-z0-9_]*\1\)/g);
      return camel ? `still camelCase: ${camel.join(', ')}` : null;
    },
  },
];

const original = readFileSync(SCHEMA_PATH, 'utf8');
let source = original;
const applied: string[] = [];
const problems: string[] = [];

for (const rule of RULES) {
  const result = rule.apply(source);
  source = result.source;
  applied.push(`${rule.name}: ${result.changed} site(s)`);

  const problem = rule.verify(source);

  if (problem) {
    problems.push(`${rule.name} -> ${problem}`);
  }
}

// A rule that matched nothing on a freshly generated file means the generator's
// output no longer looks the way this script expects. Failing here is the whole
// point: the alternative is a schema that quietly lost its time zones.
if (problems.length > 0) {
  console.error('✗ better-auth schema patch failed:');
  for (const problem of problems) {
    console.error(`  - ${problem}`);
  }
  process.exit(1);
}

if (source === original) {
  console.log('✓ better-auth schema already conforms (nothing to patch)');
} else {
  writeFileSync(SCHEMA_PATH, source);
  console.log('✓ patched better-auth schema');
  for (const entry of applied) {
    console.log(`  - ${entry}`);
  }
}
