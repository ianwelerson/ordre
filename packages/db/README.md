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

## 📚 Further Reading

- [Data Model](../../apps/docs/content/docs/engineering/data-model.mdx) - every table, field by field
- [Row-Level Security](../../apps/docs/content/docs/engineering/authorization/row-level-security.mdx) - how the policies work
- [Root README](../../README.md) - monorepo overview
