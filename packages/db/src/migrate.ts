import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { migrate as pgMigrate } from 'drizzle-orm/node-postgres/migrator';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Migrations are generated next to this file by drizzle-kit (`db:generate`).
export const migrationsFolder = join(dirname(fileURLToPath(import.meta.url)), 'migrations');

/**
 * Applies all pending SQL migrations to `db`.
 *
 * Idempotent: drizzle records applied migrations in its own `drizzle` schema, so
 * re-running only applies what's missing. Used by the integration test harness to
 * bring a fresh test database up to the current schema before seeding.
 */
export const migrate = <TSchema extends Record<string, unknown>>(db: NodePgDatabase<TSchema>) =>
  pgMigrate(db, { migrationsFolder });
