import { defineConfig } from 'eslint/config';

import { reactConfig } from '@ordre/config/eslint/react';

export default defineConfig([
  {
    extends: [...reactConfig],
    ignores: ['.react-router/**'],
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
