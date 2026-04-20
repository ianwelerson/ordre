import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

const EXCLUDE_PATTERN = [
  'node_modules/**',
  'coverage/**',
  'vitest/**',
  'icons/custom/**',
  '.*/**',
  '**/*.css',
  '**/*.svg',
  '**/*.config.{ts,js}',
  '**/*.stories.*',
];

export default defineConfig({
  plugins: [react()],
  test: {
    coverage: {
      provider: 'v8',
      exclude: EXCLUDE_PATTERN,
      include: ['src/**/*.tsx'],
    },
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: EXCLUDE_PATTERN,
    browser: {
      provider: playwright(),
      enabled: true,
      headless: true,
      instances: [{ browser: 'chromium' }],
    },
  },
});
