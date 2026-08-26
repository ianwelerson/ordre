import vitest from '@vitest/eslint-plugin';
import { defineConfig } from 'eslint/config';

import { reactConfig } from '@ordre/config/eslint/react';

export default defineConfig([
  {
    extends: [...reactConfig],
  },
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['**/*.test.{ts,tsx}'],
    plugins: { vitest },
    rules: {
      'vitest/consistent-test-it': ['error', { fn: 'it', withinDescribe: 'it' }],
    },
  },
]);
