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
  },
  // `it` for unit tests, matching the convention in apps/api.
  {
    files: ['**/*.test.ts'],
    plugins: { vitest },
    rules: {
      'vitest/consistent-test-it': ['error', { fn: 'it', withinDescribe: 'it' }],
    },
  },
]);
