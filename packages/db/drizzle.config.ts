import { defineConfig } from 'drizzle-kit';

// drizzle-kit is dev tooling. The connection string is shared infra and lives
// in the workspace-root .env - this package never holds env of its own.
// CI/prod: no file present -> ambient DATABASE_URL is used.
try {
  process.loadEnvFile('../../.env');
} catch {
  // root .env is optional - rely on ambient env vars
}

// Migrations must run as the database OWNER - they CREATE POLICY / ALTER TABLE,
// which the restricted runtime role (`ordre_app`, used via DATABASE_URL) cannot
// do. Prefer DATABASE_OWNER_URL, falling back to DATABASE_URL for environments
// that only define a single (owner) connection string.
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schemas/index.ts',
  out: './src/migrations',
  dbCredentials: { url: process.env.DATABASE_OWNER_URL ?? process.env.DATABASE_URL! },
});
