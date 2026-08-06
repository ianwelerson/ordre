# 🌎 marketing

The **marketing** app is the public-facing website for Ordre - the home page, pricing, about, and legal pages. It's the first impression: fast, static-friendly, and localized.

Built with **[Next.js 16](https://nextjs.org/) (App Router)**, React 19, [`@ordre/ui`](../../packages/ui), and [`next-intl`](https://next-intl.dev/) with path-based locale routing.

---

## 🧩 Responsibilities

- Present the product to prospective workspace members
- Host pricing, about, privacy, and terms pages
- Drive sign-ups toward the [`dashboard`](../dashboard) app
- Serve localized content via path-based routing

---

## 🧰 Tech Stack

**Next.js 16** (App Router), React 19, `@ordre/ui`, and Tailwind CSS v4, with `next-intl` doing path-based locale routing.

Everything else - TypeScript, Turborepo, Vitest, ESLint, Prettier, Syncpack - is monorepo-wide; see [Shared Tech Stack](../docs/content/docs/engineering/architecture.mdx#-shared-tech-stack).

Full breakdown, alongside this workspace's folder structure: **[Architecture](../docs/content/docs/engineering/architecture.mdx#-marketing)**.

---

## 🚀 Getting Started

Install and run the whole stack from the repo root - see **[Setup → Running the Project](../docs/content/docs/setup/running-the-project.mdx)**. To run only this app:

```bash
pnpm --filter marketing dev
```

`pnpm dev` serves it over HTTPS at **https://ordre.localhost** (via portless); `pnpm dev:app` runs the raw Next.js dev server on **http://localhost:3000**.

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

## 📚 Further Reading

The folder layout (`app/` · `views/` · `shared/`), the import alias, and the locale routing (`en` unprefixed, `pt` under `/br`) are documented once in the docs project:

- [Architecture → Marketing App Structure](../docs/content/docs/engineering/architecture.mdx#-marketing)
- [Architecture → i18n Structure](../docs/content/docs/engineering/architecture.mdx#-i18n-structure)
- [Root README](../../README.md) - monorepo overview
