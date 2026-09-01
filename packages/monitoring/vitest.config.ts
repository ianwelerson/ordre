import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      // `src/test/` is the harness itself - covering it only skews the average.
      exclude: ['**/*.config.{ts,js}', '**/*.d.ts', 'src/test/**'],
    },
    // `config.ts` reads both at import time. `production` gives the raw JSON
    // records a log platform ingests rather than the `pino-pretty` output
    // development sees, and `debug` lets the demoted lines be asserted on at all.
    env: { NODE_ENV: 'production', LOG_LEVEL: 'debug' },
    globals: true,
  },
});
