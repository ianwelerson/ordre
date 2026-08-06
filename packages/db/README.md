# @ordre/db

Drizzle ORM schema, migrations, and the shared Postgres connection for Ordre.

## Contents

- `src/schemas` - table definitions (the source of truth for the DB shape)
- `src/migrations` - generated SQL migrations, applied via `pnpm db:migrate`
- `src/connection.ts` - `createPool` / `createDb` helpers consumed by the API
- `src/seeds`, `src/seed.ts` - seed data (plan catalog), run via `pnpm db:seed`
- `scripts` - tooling that runs around the generators
- `drawdb` - the [drawDB](https://drawdb.app) ERD, kept in step with `src/schemas`

Field-level notes on every table - what each column is for, which are derived, and
which tables are planned rather than built - live in
**[Data Model](../../apps/docs/content/docs/engineering/data-model.mdx)**.

## 🧰 Tech Stack

**Drizzle ORM** + `drizzle-kit` over node-postgres (`pg`). The `pg` driver rather than Neon's HTTP driver, because the API is a long-lived process.

Everything else - TypeScript, Turborepo, Vitest, ESLint, Prettier, Syncpack - is monorepo-wide; see [Shared Tech Stack](../../apps/docs/content/docs/engineering/architecture.mdx#-shared-tech-stack).

Full breakdown, alongside this workspace's folder structure: **[Architecture](../../apps/docs/content/docs/engineering/architecture.mdx#ordredb)**.

---

## Scripts

| Script             | What it does                                                              |
| ------------------ | ------------------------------------------------------------------------- |
| `pnpm db:generate` | Generate a migration from schema changes                                  |
| `pnpm db:migrate`  | Apply pending migrations (runs as the **owner** via `DATABASE_OWNER_URL`) |
| `pnpm db:push`     | Push the schema directly (dev only)                                       |
| `pnpm db:seed`     | Seed reference data (the plan catalog)                                    |
| `pnpm db:studio`   | Open Drizzle Studio                                                       |
| `pnpm auth:patch`  | Apply our conventions to the generated Better Auth schema (see below)     |

## The generated Better Auth schema

`src/schemas/better-auth.ts` is emitted by the Better Auth CLI and must never be
edited by hand - the next `pnpm --filter api auth:generate` would overwrite it.

That generator has no options for two fixes we need on its timestamp columns, so
`auth:generate` chains `auth:patch` (`scripts/patch-better-auth-schema.ts`),
which rewrites its output: timestamps become timezone-aware, and `updated_at`
gets a default (the generator marks it `NOT NULL` without one, so inserts that
don't set it explicitly fail). The rules are idempotent and keyed off shapes
rather than specific table names, and the script **fails the command** if it
cannot apply one - a silent no-op would mean losing time zones without noticing.

Everything Better Auth addresses by name - tables, columns, schema properties -
is left exactly as generated, so its adapter and tooling see the standard schema.
Purely cosmetic differences (index naming, import order) are deliberately not
patched: they buy nothing and add divergence to maintain.

## Roles & Row-Level Security

The API runtime connects as a restricted `ordre_app` role so Postgres Row-Level
Security is actually enforced, while migrations run as the database owner.
Creating that role is a **manual, one-time step per database** - the only part of
database setup that is not automated.

See **[Database Roles & RLS](../../apps/docs/content/docs/setup/database-roles.mdx)**
for the exact SQL and the per-environment (local, Neon staging, Neon prod)
instructions.

---

## 📚 Further Reading

- [Data Model](../../apps/docs/content/docs/engineering/data-model.mdx) - every table, field by field
- [Row-Level Security](../../apps/docs/content/docs/engineering/authorization/row-level-security.mdx) - how the policies work
- [Root README](../../README.md) - monorepo overview
