# 🔗 board

The **board** app is the client-facing surface of Ordre. It renders the shareable status page that a client opens from the unique link sent by a workspace member - no login, no account creation, just a URL.

It is built with **[React Router v7](https://reactrouter.com/) in framework mode** (SSR). Next.js was not needed here, but SSR is - a client landing on the board should see content on first paint, and OG tags should render for link previews down the road.

---

## 🧩 Responsibilities

- Render the public board page for a given token
- Stream timeline updates and chat messages to the client
- Gate sensitive fields behind email/phone verification
- Handle locale detection via URL prefix, cookie, or `Accept-Language`

Everything that _manages_ boards lives in the [`dashboard`](../dashboard) app - this app is read-first and interaction-light by design.

---

## 🧰 Tech Stack

- **Framework**: [React Router v7](https://reactrouter.com/) (framework mode, SSR)
- **Bundler**: [Vite](https://vitejs.dev/)
- **UI**: React 19, Tailwind CSS v4
- **i18n**: [`i18next`](https://www.i18next.com/) + [`react-i18next`](https://react.i18next.com/) + [`remix-i18next`](https://github.com/sergiodxa/remix-i18next)
- **Testing**: [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/) (Playwright as browser provider)

---

## 📁 Structure

```
apps/board/
├── src/
│   ├── app/                     # React Router v7 app directory (SSR concerns)
│   │   ├── pages/               # Route modules
│   │   ├── api/                 # Route-mounted endpoints (e.g. /api/locales/:lng/:ns)
│   │   ├── locale/              # Locale prefix helpers
│   │   ├── middleware/          # remix-i18next middleware
│   │   ├── entry.client.tsx     # Client entry
│   │   ├── entry.server.tsx     # Server entry
│   │   ├── root.tsx             # Root layout
│   │   └── routes.ts            # Route config
│   │
│   ├── views/                   # Page UI components (one folder per view)
│   └── shared/                  # Reusable app-level code (hooks, utils, i18n, etc.)
│
├── react-router.config.ts
├── vite.config.ts
├── vitest.config.ts
├── Dockerfile
└── package.json
```

### Three-folder convention

| Folder    | Responsibility                                              |
| --------- | ----------------------------------------------------------- |
| `app/`    | Route definitions, middleware, entry files, API routes      |
| `views/`  | Page UI and page-level logic, tests, and stories            |
| `shared/` | Cross-cutting code reused across views (hooks, utils, i18n) |

### Import alias

| Alias | Resolves to |
| ----- | ----------- |
| `@/*` | `src/*`     |

---

## 🚀 Getting Started

From the repo root:

```bash
pnpm install
pnpm --filter board dev
```

Or from this directory:

```bash
pnpm dev
```

The app is served at **http://localhost:5173** by default.

---

## 🔍 Scripts

| Command             | Description                             |
| ------------------- | --------------------------------------- |
| `pnpm dev`          | Start the dev server (HMR)              |
| `pnpm build`        | Build for production                    |
| `pnpm start`        | Run the production server from `build/` |
| `pnpm check-types`  | Typegen + `tsc`                         |
| `pnpm lint`         | ESLint (fails on warnings)              |
| `pnpm format`       | Prettier write                          |
| `pnpm format:check` | Prettier check                          |
| `pnpm test:unit`    | Vitest with coverage                    |
| `pnpm test:unit:ci` | Vitest run once (CI)                    |
| `pnpm test:unit:ui` | Vitest UI                               |

---

## 🌍 i18n

**Supported locales**: English (`en`, default) and Portuguese (`pt`).

| Path  | Locale |
| ----- | ------ |
| `/`   | `en`   |
| `/br` | `pt`   |

Detection order: custom path prefix → `lng` cookie → `Accept-Language` header.

Shared translations come from [`@ordre/i18n`](../../packages/i18n) and are merged with app-specific messages at runtime.

---

## 🐳 Docker

A `Dockerfile` is provided for containerized deployment:

```bash
docker build -t ordre-board .
docker run -p 3000:3000 ordre-board
```

---

## 📚 Further Reading

- [Root README](../../README.md) - monorepo overview
- [architecture.md](../../../ordre-internal-docs/architecture.md) - monorepo architecture (internal docs)
