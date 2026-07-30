import vitest from '@vitest/eslint-plugin';
import { defineConfig } from 'eslint/config';

import { config as baseConfig } from '@ordre/config/eslint/base';

export default defineConfig([
  ...baseConfig,
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
    },
  },
  // Test-function convention: `it` for unit tests, `test` for integration tests.
  // `*.routes.test.ts` are the integration suite (see vitest.config.ts projects).
  {
    files: ['**/*.test.ts'],
    plugins: { vitest },
    rules: {
      'vitest/consistent-test-it': ['error', { fn: 'it', withinDescribe: 'it' }],
    },
  },
  {
    files: ['**/*.routes.test.ts'],
    rules: {
      'vitest/consistent-test-it': ['error', { fn: 'test', withinDescribe: 'test' }],
    },
  },
]);
