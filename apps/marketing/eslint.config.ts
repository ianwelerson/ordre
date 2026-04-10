import { defineConfig } from 'eslint/config';

import { nextJsConfig } from '@ordre/config/eslint/next';

export default defineConfig([
  {
    extends: [...nextJsConfig],
  },
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
]);
