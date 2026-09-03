import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/utils/*.ts'],
      exclude: ['**/*.config.{ts,js}', '**/*.d.ts'],
    },
    globals: true,
  },
});
