import { defineConfig } from 'vitest/config';

const EXCLUDE_PATTERN = [
  'node_modules/**',
  'coverage/**',
  'vitest/**',
  '.*/**',
  '**/*.config.{ts,js}',
  '**/*.openapi.ts',
  'src/adapters/express/index.ts',
  'src/config/openapi-registry.ts',
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
        },
      },
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['src/**/*.test.ts'],
          exclude: EXCLUDE_PATTERN,
        },
      },
    ],
    globals: true,
  },
});
