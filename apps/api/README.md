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

## 🚀 Getting Started

Install and run the whole stack from the repo root - see **[Setup → Running the Project](../docs/content/docs/start/running-the-project.mdx)**. To run only the API:

```bash
pnpm --filter api api:dev
```

`pnpm api:dev` serves it over HTTPS at **https://api.ordre.localhost** (via portless); `pnpm api:dev:app` runs the raw server on **http://localhost:3000**. Health check: `GET /api/health`.

The API validates its environment with a Zod schema at startup, so a missing or malformed value fails immediately rather than at request time - including `RESEND_API_KEY`, which is required on every stage. See **[Setup → Environment Variables](../docs/content/docs/start/environment-variables.mdx)**.

---

## 📚 Further Reading

Everything conceptual lives in the docs project, not here:

- [Architecture](../docs/content/docs/architecture/index.mdx) - folder conventions and package boundaries
- [Authorization](../docs/content/docs/architecture/authorization) - RBAC guards and row-level security
- [Transactional Outbox](../docs/content/docs/architecture/outbox.mdx) - how email is queued and delivered
- [Testing](../docs/content/docs/start/testing.mdx) - the two-tier test strategy
- [Root README](../../README.md) - monorepo overview
