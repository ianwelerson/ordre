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
    // The component barrel is the package's public API contract. `export *`
    // makes it look complete without being auditable, and has already leaked
    // internal helpers while silently dropping component prop types.
    files: ['src/components/index.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ExportAllDeclaration',
          message:
            'Re-export components explicitly (`export { Thing, type ThingProps } from ...`) so this file stays a readable list of the public API.',
        },
      ],
    },
  },
]);
