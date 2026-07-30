import { createDb, createPool } from './connection.ts';
import { seedPlans } from './seeds/plan.ts';

// Mirror drizzle.config.ts: the connection string is shared infra and lives in
// the workspace-root .env. CI/prod: no file present -> ambient env is used.
try {
  process.loadEnvFile('../../.env');
} catch {
  // root .env is optional - rely on ambient env vars
}

// Seeding catalog data is an admin operation (it may write to RLS-protected or
// owner-only tables), so prefer the owner connection like migrations do.
const dbUrl = process.env.DATABASE_OWNER_URL ?? process.env.DATABASE_URL;

if (!dbUrl) {
  throw new Error('DATABASE_OWNER_URL or DATABASE_URL must be set to seed the database.');
}

const pool = createPool(dbUrl);
const db = createDb(pool);

try {
  await seedPlans(db);
  console.log('✓ Seeded plan catalog');
} finally {
  await pool.end();
}
