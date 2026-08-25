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

## 🚀 Getting Started

Install and run the whole stack from the repo root - see **[Setup → Running the Project](../docs/content/docs/setup/running-the-project.mdx)**. To run only this app:

```bash
pnpm --filter marketing dev
```

`pnpm dev` serves it over HTTPS at **https://ordre.localhost** (via portless); `pnpm dev:app` runs the raw Next.js dev server on **http://localhost:3000**.

---

## 📚 Further Reading

The folder layout (`app/` · `views/` · `shared/`), the import alias, and the locale routing (`en` unprefixed, `pt` under `/br`) are documented once in the docs project:

- [Architecture → Marketing App Structure](../docs/content/docs/engineering/architecture.mdx#-marketing)
- [Architecture → i18n Structure](../docs/content/docs/engineering/architecture.mdx#-i18n-structure)
- [Root README](../../README.md) - monorepo overview
