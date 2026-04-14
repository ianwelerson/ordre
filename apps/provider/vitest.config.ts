import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const EXCLUDE_PATTERN = [
  'node_modules/**',
  'coverage/**',
  'public/**',
  'vitest/**',
  '.*/**',
  '**/*.css',
  '**/*.config.{ts,js}',
];

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'next/font/local': fileURLToPath(new URL('./vitest/next-font.ts', import.meta.url)),
    },
  },
  test: {
    setupFiles: ['./vitest/setup.ts'],
    coverage: {
      provider: 'v8',
      exclude: EXCLUDE_PATTERN,
    },
    include: ['app/**/*.{test,spec}.{ts,tsx}'],
    exclude: EXCLUDE_PATTERN,
    browser: {
      provider: playwright(),
      enabled: true,
      headless: true,
      instances: [{ browser: 'chromium' }],
    },
  },
});
