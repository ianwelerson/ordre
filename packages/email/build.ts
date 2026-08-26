import { build } from 'esbuild';

/**
 * Bundles the package to plain JavaScript so `apps/api` can import it.
 *
 * The API runs TypeScript directly on Node, and Node's type stripping removes
 * type annotations without transforming JSX, so a `.tsx` file reaches it as a
 * syntax error. This is the one workspace that needs compiling, and the only
 * reason it needs compiling.
 *
 * `packages: 'external'` leaves every dependency to be resolved at runtime,
 * including `@ordre/core`, whose `.ts` sources Node strips the same way it does
 * the API's own.
 */
await build({
  entryPoints: ['src/index.tsx'],
  outfile: 'dist/index.js',
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node24',
  packages: 'external',
  jsx: 'automatic',
  sourcemap: true,
  logLevel: 'info',
});
