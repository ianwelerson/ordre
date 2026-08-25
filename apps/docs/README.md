# 📚 docs

The **docs** app is Ordre's documentation site, served at `docs.ordre.app`. It hosts two sections under one Next.js app: the internal **Guides** and the generated **API Reference**.

Built with **[Fumadocs](https://fumadocs.dev)** on Next.js.

---

## 🧩 Responsibilities

- Serve the internal **Guides** (`/internal-docs`) - architecture, specs, infrastructure, pricing, brand, and roadmap
- Serve the **API Reference** (`/api-docs`), generated from the OpenAPI spec with an interactive request playground
- Redirect the root (`/`) to the Guides (the docs app has no landing page of its own)
- Expose raw guide markdown for LLM/agent consumption

The root (`/`) redirects to `/internal-docs` on every environment (see `src/app/page.tsx`).

---

## 🚀 Getting Started

Install and run the whole stack from the repo root - see **[Setup → Running the Project](content/docs/setup/running-the-project.mdx)**. To run only the docs:

```bash
pnpm --filter docs docs:dev
```

`pnpm docs:dev` serves it over HTTPS at **https://docs.ordre.localhost** (via portless); `pnpm docs:dev:app` runs the raw server (OpenAPI watcher + `next dev` together).

---

## 📚 Further Reading

How a guide page is added, and which pages are generated rather than written, are
documented once in the docs project:

- [Architecture → docs](content/docs/engineering/architecture.mdx#-docs)
- [Root README](../../README.md) - monorepo overview
