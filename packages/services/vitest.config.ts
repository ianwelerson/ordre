import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      // `src/test/` is the harness itself - covering it only skews the average.
      exclude: ['**/*.config.{ts,js}', '**/*.d.ts', 'src/test/**'],
    },
    globals: true,
  },
});
