# 🌎 marketing

The **marketing** app is the public-facing website for Ordre - the home page, pricing, about, and legal pages. It's the first impression: fast, static-friendly, and localized.

Built with **[Next.js](https://nextjs.org/) (App Router)**.

---

## 🧩 Responsibilities

- Present the product to prospective workspace members
- Host pricing, about, privacy, and terms pages
- Drive sign-ups toward the [`dashboard`](../dashboard) app
- Serve localized content via path-based routing

---

## 🧰 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **UI**: React 19, [`@ordre/ui`](../../packages/ui), Tailwind CSS v4
- **i18n**: [`next-intl`](https://next-intl.dev/) with path-based routing (`as-needed` mode)
- **Testing**: [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/) (Playwright as browser provider)

---

## 📁 Structure

```
apps/marketing/
├── src/
│   ├── app/
│   │   └── [locale]/                 # Locale prefix wraps all marketing routes
│   │       ├── about/
│   │       ├── pricing/
│   │       ├── terms-conditions/
│   │       ├── privacy/
│   │       ├── page.tsx              # Home
│   │       ├── layout.tsx
│   │       └── not-found.tsx
│   │
│   ├── views/                        # Page UI components (one folder per page)
│   ├── shared/                       # Reusable app-level code
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── types/
│   │   └── i18n/
│   │       ├── routing.ts            # next-intl routing config
│   │       ├── navigation.ts         # Locale-aware Link, useRouter, etc.
│   │       ├── requests.ts           # getRequestConfig
│   │       └── messages/
│   └── proxy.ts                      # next-intl middleware
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

From the repo root:

```bash
pnpm install
pnpm --filter marketing dev
```

Or from this directory:

```bash
pnpm dev
```

`pnpm dev` proxies the app through **[portless](https://www.npmjs.com/package/portless)**, which serves it over HTTPS at a stable local hostname:

**https://ordre.localhost**

Run `pnpm dev:app` to start the raw Next.js dev server without portless (defaults to `http://localhost:3000`).

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

| Path      | Locale |
| --------- | ------ |
| `/`       | `en`   |
| `/br/...` | `pt`   |

Default locale carries no prefix (`as-needed` mode). Shared translations come from [`@ordre/i18n`](../../packages/i18n) and are merged with app-specific messages at runtime.

---

## 📚 Further Reading

- [Root README](../../README.md) - monorepo overview
- [architecture.md](../../../ordre-internal-docs/architecture.md) - monorepo architecture (internal docs)
