# 🛰️ api

The **api** is the backend HTTP server for Ordre - the single source of truth for boards, members, workspaces, and authentication. Frontend apps ([`dashboard`](../dashboard), [`board`](../board), [`marketing`](../marketing)) reach it through the [`@ordre/services`](../../packages/services) HTTP client.

Built with **[Express 5](https://expressjs.com/) on Node.js**.

---

## 🧩 Responsibilities

- Expose REST endpoints for boards, members, workspaces, and auth
- Validate requests with [`@ordre/core/schemas`](../../packages/core) (Zod)
- Persist data via [`@ordre/db`](../../packages/db) (Drizzle + Neon)
- Generate the OpenAPI spec consumed by the docs app

---

## 🧰 Tech Stack

- **Runtime**: Node.js 24+
- **Framework**: [Express 5](https://expressjs.com/)
- **Middleware**: [`helmet`](https://helmetjs.github.io/), [`cors`](https://github.com/expressjs/cors), [`morgan`](https://github.com/expressjs/morgan)
- **Validation**: [Zod 4](https://zod.dev/) via [`@ordre/core/schemas`](../../packages/core)
- **Database**: [Drizzle ORM](https://orm.drizzle.team/) via [`@ordre/db`](../../packages/db)

---

## 📁 Structure

```
apps/api/
├── src/
│   ├── adapters/
│   │   └── express/                    # HTTP adapter - swappable (Lambda/Vercel-ready)
│   │       ├── routes/                 # Thin route handlers
│   │       ├── server.ts               # Express app setup
│   │       └── index.ts                # Listener (calls app.listen)
│   │
│   ├── controllers/                    # Business logic + OpenAPI contract + tests
│   │   └── health/
│   │       ├── index.ts                # Public surface (barrel)
│   │       ├── health.controller.ts
│   │       ├── health.schemas.ts       # Local Zod schemas (optional)
│   │       ├── health.openapi.ts
│   │       ├── health.test.ts
│   │       └── helpers/                # Internal helpers (only when >1 file)
│   │
│   ├── middleware/                     # Auth, validation, error handling
│   └── utils/
│
├── env.ts                              # Validated env (Zod)
├── .env.example
├── tsconfig.json
└── package.json
```

### Layer responsibilities

| Layer          | Responsibility                                                                            |
| -------------- | ----------------------------------------------------------------------------------------- |
| `adapters/`    | HTTP framework integration. Parses requests, calls controllers, shapes responses.         |
| `controllers/` | Business logic, validation, DB queries. No Express dependency - portable across adapters. |
| `middleware/`  | Auth, error handling, cross-cutting request concerns.                                     |

### Controller folder convention

Each controller folder is a self-contained feature unit owning the controller(s), OpenAPI registration, local schemas, tests, and helpers. The OpenAPI file is co-located with the controller (not the route) so it travels with the logic if the HTTP adapter changes.

| File              | Responsibility                                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------------------------------- |
| `index.ts`        | Barrel. Public surface only (`*.controller.ts` and `*.openapi.ts`).                                                 |
| `*.controller.ts` | Controller function(s). No Express dependency.                                                                      |
| `*.openapi.ts`    | OpenAPI registration for the feature. One per folder.                                                               |
| `*.schemas.ts`    | Local Zod schemas. Use only when controller-internal.                                                               |
| `*.test.ts`       | Co-located unit tests for fault injection (mocked DB). See [Testing](../docs/content/docs/engineering/testing.mdx). |
| `helpers/`        | Folder for 2+ internal helpers. Single helper goes in a flat `*.helpers.ts` instead.                                |

See [Architecture](../docs/content/docs/engineering/architecture.mdx#controller-folder-convention) for the full rule set.

### Subpath imports

Node's `imports` field in `package.json` exposes internal paths so consumers never reach past a folder's `index.ts`:

| Alias            | Resolves to                    |
| ---------------- | ------------------------------ |
| `#env`           | `./env.ts`                     |
| `#controllers/*` | `./src/controllers/*/index.ts` |
| `#/*`            | `./src/*`                      |

```ts
import { healthController } from '#controllers/health';
import { env, isProd } from '#env';
```

---

## 🚀 Getting Started

Install and run the whole stack from the repo root - see **[Setup → Running the Project](../docs/content/docs/setup/running-the-project.mdx)**. To run only the API:

```bash
pnpm --filter api api:dev
```

`pnpm api:dev` serves it over HTTPS at **https://api.ordre.localhost** (via portless); `pnpm api:dev:app` runs the raw server on **http://localhost:3000**. Health check: `GET /health`.

---

## 🔍 Scripts

| Command             | Description                                       |
| ------------------- | ------------------------------------------------- |
| `pnpm api:dev`      | Start the server via portless (HTTPS proxy)       |
| `pnpm api:dev:app`  | Start the raw server with `--watch` (auto-reload) |
| `pnpm api:start`    | Run the server without watch (production-like)    |
| `pnpm check-types`  | `tsc --noEmit`                                    |
| `pnpm lint`         | ESLint (fails on warnings)                        |
| `pnpm format`       | Prettier write                                    |
| `pnpm format:check` | Prettier check                                    |

---

## 🌍 Environment

The API reads environment variables through a Zod-validated schema in `env.ts` - invalid values fail at startup, not at request time. See **[Setup → Environment Variables](../docs/content/docs/setup/environment-variables.mdx)** for every variable and how the `.env` files load.

---

## 📚 Further Reading

- [Root README](../../README.md) - monorepo overview
- [Architecture](../docs/content/docs/engineering/architecture.mdx) - monorepo architecture (docs project)
- [Testing](../docs/content/docs/engineering/testing.mdx) - the two-tier test strategy (integration vs. unit)
