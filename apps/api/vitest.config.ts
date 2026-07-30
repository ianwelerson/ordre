import { defineConfig } from 'vitest/config';

const EXCLUDE_PATTERN = [
  'node_modules/**',
  'coverage/**',
  'vitest/**',
  '.*/**',
  '**/*.config.{ts,js}',
  '**/*.openapi.ts',
  '**/*.d.ts',
  'src/adapters/express/index.ts',
  'src/config/openapi-registry.ts',
  // Type-only modules: no runtime code to cover, so they only skew the average.
  'src/types/**',
  'src/test/**',
];

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      exclude: EXCLUDE_PATTERN,
      include: ['src/**/*.ts'],
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'integration',
          include: ['src/**/*.routes.test.ts'],
          exclude: EXCLUDE_PATTERN,
          // One shared test DB: migrate + final-clean once, reset + seed per test.
          globalSetup: ['src/test/global-setup.ts'],
          setupFiles: ['src/test/integration.setup.ts'],
          // Serialize test files so one file's per-test TRUNCATE never wipes data
          // another file is mid-way through using.
          fileParallelism: false,
        },
      },
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['src/**/*.test.ts'],
          // `*.routes.test.ts` are integration tests (own project); the glob above
          // would otherwise pick them up here too, without the DB setup they need.
          exclude: [...EXCLUDE_PATTERN, '**/*.routes.test.ts'],
        },
      },
    ],
    globals: true,
  },
});
