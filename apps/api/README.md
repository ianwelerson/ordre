# 🛰️ api

The **api** is the backend HTTP server for Ordre - the single source of truth for boards, members, workspaces, and authentication. Frontend apps ([`dashboard`](../dashboard), [`board`](../board), [`marketing`](../marketing)) will reach it through the [`@ordre/services`](../../packages/services) HTTP client, which is not built yet.

Built with **[Express 5](https://expressjs.com/) on Node.js**.

---

## 🧩 Responsibilities

- Expose REST endpoints for boards, members, workspaces, and auth
- Validate requests with [`@ordre/core/schemas`](../../packages/core) (Zod)
- Persist data via [`@ordre/db`](../../packages/db) (Drizzle + Neon)
- Deliver transactional email through the outbox worker
- Generate the OpenAPI spec consumed by the docs app

---

## 🧰 Tech Stack

Express 5 on Node.js, with **Better Auth** for sessions, **Drizzle ORM** via `@ordre/db`, **Zod 4** via `@ordre/core/schemas`, and **Resend** for email. `helmet` + `cors` harden the HTTP layer; `@asteasolutions/zod-to-openapi` produces the spec; routes are tested with `supertest`.

Everything else - TypeScript, Turborepo, Vitest, ESLint, Prettier, Syncpack - is monorepo-wide; see [Shared Tech Stack](../docs/content/docs/engineering/architecture.mdx#-shared-tech-stack).

Full breakdown, alongside this workspace's folder structure: **[Architecture](../docs/content/docs/engineering/architecture.mdx#-api)**.

---

## 🚀 Getting Started

Install and run the whole stack from the repo root - see **[Setup → Running the Project](../docs/content/docs/setup/running-the-project.mdx)**. To run only the API:

```bash
pnpm --filter api api:dev
```

`pnpm api:dev` serves it over HTTPS at **https://api.ordre.localhost** (via portless); `pnpm api:dev:app` runs the raw server on **http://localhost:3000**. Health check: `GET /api/health`.

The API validates its environment with a Zod schema at startup, so a missing or malformed value fails immediately rather than at request time - including `RESEND_API_KEY`, which is required on every stage. See **[Setup → Environment Variables](../docs/content/docs/setup/environment-variables.mdx)**.

---

## 🔍 Scripts

| Command                        | Description                                              |
| ------------------------------ | -------------------------------------------------------- |
| `pnpm api:dev`                 | Start the server via portless (HTTPS proxy)              |
| `pnpm api:dev:app`             | Start the raw server with `--watch` (auto-reload)        |
| `pnpm api:start`               | Run the server without watch (production-like)           |
| `pnpm api:docs:generate`       | Regenerate `apps/docs/public/openapi.json` from the spec |
| `pnpm auth:generate`           | Regenerate the Better Auth Drizzle schema                |
| `pnpm test:unit`               | Both Vitest projects, watch mode, with coverage          |
| `pnpm test:unit:ci`            | Both projects, single run (CI)                           |
| `pnpm test:unit:integration`   | The `integration` project only (needs the test DB)       |
| `pnpm test:unit:unit`          | The `unit` project only (no DB)                          |
| `pnpm check-types`             | `tsc`                                                    |
| `pnpm lint`                    | ESLint (fails on warnings)                               |
| `pnpm format` / `format:check` | Prettier write / check                                   |

---

## 📁 Where things live

| Path              | Contents                                                                      |
| ----------------- | ----------------------------------------------------------------------------- |
| `adapters/`       | HTTP framework integration - routes, middlewares, server assembly, entrypoint |
| `config/`         | Env, logger, DB pool, RLS context, Better Auth, OpenAPI, URLs                 |
| `controllers/`    | Business logic, OpenAPI contract, and tests. No Express dependency            |
| `services/`       | Third-party providers (email via Resend)                                      |
| `workers/`        | Background loops (outbox delivery), started from the entrypoint               |
| `utils/`          | Framework-agnostic helpers                                                    |
| `types/`, `test/` | Request context and DB row types; the test harness                            |

The folder conventions - what belongs in a controller folder, how `*.openapi.ts` is co-located, the subpath imports - are documented once in **[Architecture → API App Structure](../docs/content/docs/engineering/architecture.mdx#-api)**.

---

## 📚 Further Reading

Everything conceptual lives in the docs project, not here:

- [Architecture](../docs/content/docs/engineering/architecture.mdx) - folder conventions and package boundaries
- [Authorization](../docs/content/docs/engineering/authorization) - RBAC guards and row-level security
- [Transactional Outbox](../docs/content/docs/engineering/outbox.mdx) - how email is queued and delivered
- [Testing](../docs/content/docs/engineering/testing.mdx) - the two-tier test strategy
- [Root README](../../README.md) - monorepo overview
