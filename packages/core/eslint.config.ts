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
]);
