import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['**/*.config.{ts,js}', '**/*.d.ts', 'src/index.tsx'],
    },
    // The tests assert on the HTML and plain-text strings a template renders to,
    // so none of them needs a DOM.
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
