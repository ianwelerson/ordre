import { defineConfig } from 'drizzle-kit';

// drizzle-kit is dev tooling. The connection string is shared infra and lives
// in the workspace-root .env - this package never holds env of its own.
// CI/prod: no file present -> ambient DATABASE_URL is used.
try {
  process.loadEnvFile('../../.env');
} catch {
  // root .env is optional - rely on ambient env vars
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schemas/index.ts',
  out: './src/migrations',
  dbCredentials: { url: process.env.DATABASE_URL! },
});
