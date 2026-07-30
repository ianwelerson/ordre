# 🧭 dashboard

The **dashboard** is the authenticated workspace app. It's where workspace members manage everything: boards, templates, members, clients, and settings. It's the control tower - the [`board`](../board) app is just one of the things it produces.

Built with **[Next.js](https://nextjs.org/) (App Router)**.

---

## 🧩 Responsibilities

- Authenticate workspace members (owner, admin, member)
- Create, view, and update boards from industry templates
- Manage workspace members, clients, and settings
- Handle workspace-level chat and notifications

---

## 🧰 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **UI**: React 19, [`@ordre/ui`](../../packages/ui), Tailwind CSS v4
- **i18n**: [`next-intl`](https://next-intl.dev/) with `Accept-Language` detection (via `Negotiator` + `intl-localematcher`)
- **Testing**: [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/) (Playwright as browser provider)

---

## 📁 Structure

```
apps/dashboard/
├── src/
│   ├── app/                          # Next.js App Router - routing only
│   │   ├── (auth)/                   # Public auth pages (login, register)
│   │   ├── (authenticated)/          # Protected pages (home, boards, members, clients, etc.)
│   │   ├── layout.tsx
│   │   └── not-found.tsx
│   │
│   ├── views/                        # Page UI components (one folder per page)
│   └── shared/                       # Reusable app-level code
│       ├── components/
│       ├── hooks/
│       ├── utils/
│       ├── types/
│       └── i18n/
│
├── next.config.ts
├── tsconfig.json
├── vitest.config.ts
└── package.json
```

### Three-folder convention

| Folder    | Responsibility                                                 |
| --------- | -------------------------------------------------------------- |
| `app/`    | Next.js App Router - routes re-export views, no business logic |
| `views/`  | Page UI and page-level logic, tests, and stories               |
| `shared/` | Cross-cutting code reused across views (hooks, utils, i18n)    |

### Import alias

| Alias | Resolves to |
| ----- | ----------- |
| `@/*` | `src/*`     |

---

## 🚀 Getting Started

Install and run the whole stack from the repo root - see **[Setup → Running the Project](../docs/content/docs/setup/running-the-project.mdx)**. To run only this app:

```bash
pnpm --filter dashboard dev
```

`pnpm dev` serves it over HTTPS at **https://dashboard.ordre.localhost** (via portless); `pnpm dev:app` runs the raw Next.js dev server on **http://localhost:3000**.

---

## 🔍 Scripts

| Command             | Description                       |
| ------------------- | --------------------------------- |
| `pnpm dev`          | Start the dev server via portless |
| `pnpm dev:app`      | Start the raw Next.js dev server  |
| `pnpm build`        | Build for production              |
| `pnpm start`        | Run the production build          |
| `pnpm check-types`  | `next typegen` + `tsc --noEmit`   |
| `pnpm lint`         | ESLint (fails on warnings)        |
| `pnpm format`       | Prettier write                    |
| `pnpm format:check` | Prettier check                    |
| `pnpm test:unit`    | Vitest with coverage              |
| `pnpm test:unit:ci` | Vitest run once (CI)              |
| `pnpm test:unit:ui` | Vitest UI                         |

---

## 🌍 i18n

**Supported locales**: English (`en`, default) and Portuguese (`pt`).

Locale is detected from the `Accept-Language` header (no URL prefix) - the dashboard is for authenticated members, so locale tends to match their browser preferences.

Shared translations come from [`@ordre/i18n`](../../packages/i18n) and are merged with app-specific messages at runtime.

---

## 📚 Further Reading

- [Root README](../../README.md) - monorepo overview
- [Architecture](../docs/content/docs/engineering/architecture.mdx) - monorepo architecture (docs project)
