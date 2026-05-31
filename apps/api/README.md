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

| File              | Responsibility                                                                       |
| ----------------- | ------------------------------------------------------------------------------------ |
| `index.ts`        | Barrel. Public surface only (`*.controller.ts` and `*.openapi.ts`).                  |
| `*.controller.ts` | Controller function(s). No Express dependency.                                       |
| `*.openapi.ts`    | OpenAPI registration for the feature. One per folder.                                |
| `*.schemas.ts`    | Local Zod schemas. Use only when controller-internal.                                |
| `*.test.ts`       | Co-located integration tests (one per controller file).                              |
| `helpers/`        | Folder for 2+ internal helpers. Single helper goes in a flat `*.helpers.ts` instead. |

See [architecture.md](../../../ordre-internal-docs/architecture.md#controller-folder-convention) for the full rule set.

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

From the repo root:

```bash
pnpm install
pnpm --filter api api:dev
```

Or from this directory:

```bash
cp .env.example .env
pnpm api:dev
```

`pnpm api:dev` proxies the server through **[portless](https://www.npmjs.com/package/portless)**, which serves it over HTTPS at a stable local hostname:

**https://api.ordre.localhost**

Run `pnpm api:dev:app` to start the raw server without portless - it listens on **http://localhost:3000** by default (override with `PORT` in `.env`).

Health check: `GET /health`.

---

## 🔍 Scripts

| Command             | Description                                    |
| ------------------- | ---------------------------------------------- |
| `pnpm api:dev`      | Start the server via portless (HTTPS proxy)       |
| `pnpm api:dev:app`  | Start the raw server with `--watch` (auto-reload) |
| `pnpm api:start`    | Run the server without watch (production-like)    |
| `pnpm check-types`  | `tsc --noEmit`                                 |
| `pnpm lint`         | ESLint (fails on warnings)                     |
| `pnpm format`       | Prettier write                                 |
| `pnpm format:check` | Prettier check                                 |

---

## 🌍 Environment

The API reads environment variables through a Zod-validated schema in `env.ts`. Invalid env vars fail at startup, not at request time.

| Variable    | Required | Default       | Notes                                      |
| ----------- | -------- | ------------- | ------------------------------------------ |
| `PORT`      | no       | `3000`        | HTTP port                                  |
| `APP_STAGE` | no       | `development` | One of `development`, `test`, `production` |
| `NODE_ENV`  | no       | `development` | Must match `APP_STAGE`                     |

In development, `.env` is auto-loaded. In test, `.env.test` is auto-loaded. In production, env vars come from the host.

---

## 📚 Further Reading

- [Root README](../../README.md) - monorepo overview
- [architecture.md](../../../ordre-internal-docs/architecture.md) - monorepo architecture (internal docs)
