# @ordre/db

Drizzle ORM schema, migrations, and the shared Postgres connection for Ordre.

## Contents

- `src/schemas` - table definitions (the source of truth for the DB shape)
- `src/migrations` - generated SQL migrations, applied via `pnpm db:migrate`
- `src/connection.ts` - `createPool` / `createDb` helpers consumed by the API
- `scripts` - tooling that runs around the generators

## Scripts

| Script             | What it does                                                              |
| ------------------ | ------------------------------------------------------------------------- |
| `pnpm db:generate` | Generate a migration from schema changes                                  |
| `pnpm db:migrate`  | Apply pending migrations (runs as the **owner** via `DATABASE_OWNER_URL`) |
| `pnpm db:push`     | Push the schema directly (dev only)                                       |
| `pnpm db:studio`   | Open Drizzle Studio                                                       |
| `pnpm auth:patch`  | Apply our conventions to the generated Better Auth schema (see below)     |

## The generated Better Auth schema

`src/schemas/better-auth.ts` is emitted by the Better Auth CLI and must never be
edited by hand - the next `pnpm --filter api auth:generate` would overwrite it.

That generator has no options for a few things we require, so `auth:generate`
chains `auth:patch` (`scripts/patch-better-auth-schema.ts`), which rewrites its
output: timestamps become timezone-aware, `updated_at` gets a default, and index
names become snake_case. The rules are idempotent and keyed off shapes rather
than specific table names, and the script **fails the command** if it cannot
apply one - a silent no-op would mean losing time zones without noticing.

Need another convention enforced? Add a rule there, not to the artifact.

## Roles & Row-Level Security

The API runtime connects as a restricted `ordre_app` role so Postgres Row-Level
Security is actually enforced, while migrations run as the database owner.
Creating that role is a **manual, one-time step per database** - the only part of
database setup that is not automated.

See **[Database Roles & RLS](../../apps/docs/content/docs/setup/database-roles.mdx)**
for the exact SQL and the per-environment (local, Neon staging, Neon prod)
instructions.
