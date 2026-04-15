import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

const EXCLUDE_PATTERN = [
  'node_modules/**',
  'coverage/**',
  'public/**',
  'vitest/**',
  '.*/**',
  '**/*.css',
  '**/*.svg',
  '**/*.config.{ts,js}',
];

export default defineConfig({
  plugins: [react()],
  test: {
    setupFiles: ['./vitest/setup.ts'],
    coverage: {
      provider: 'v8',
      exclude: EXCLUDE_PATTERN,
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
