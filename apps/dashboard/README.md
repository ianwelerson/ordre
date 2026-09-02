# 🧭 dashboard

The **dashboard** is the authenticated workspace app. It's where workspace members manage everything: boards, templates, members, clients, and settings. It's the control tower - the [`board`](../board) app is just one of the things it produces.

Built with **[Next.js 16](https://nextjs.org/) (App Router)**, React 19, [`@ordre/ui`](../../packages/ui), and [`next-intl`](https://next-intl.dev/).

---

## 🧩 Responsibilities

- Authenticate workspace members (owner, admin, member)
- Create, view, and update boards from industry templates
- Manage workspace members, clients, and settings
- Handle workspace-level chat and notifications

---

## 🚀 Getting Started

Install and run the whole stack from the repo root - see **[Setup → Running the Project](../docs/content/docs/start/running-the-project.mdx)**. To run only this app:

```bash
pnpm --filter dashboard dev
```

`pnpm dev` serves it over HTTPS at **https://dashboard.ordre.localhost** (via portless); `pnpm dev:app` runs the raw Next.js dev server on **http://localhost:3000**.

---

## 📚 Further Reading

The folder layout (`app/` · `views/` · `shared/`), the import alias, and the i18n setup are the same three-folder convention every frontend app follows, and are documented once in the docs project:

- [Architecture → Dashboard App Structure](../docs/content/docs/architecture/apps.mdx#dashboard)
- [Architecture → i18n Structure](../docs/content/docs/architecture/conventions.mdx#i18n-structure)
- [Root README](../../README.md) - monorepo overview
