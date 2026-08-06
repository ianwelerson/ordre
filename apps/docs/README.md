# 📚 docs

The **docs** app is Ordre's documentation site, served at `docs.ordre.app`. It hosts two sections under one Next.js app: the internal **Guides** and the generated **API Reference**.

Built with **[Fumadocs](https://fumadocs.dev)** on Next.js.

---

## 🧩 Responsibilities

- Serve the internal **Guides** (`/internal-docs`) - architecture, specs, infrastructure, pricing, brand, and roadmap
- Serve the **API Reference** (`/api-docs`), generated from the OpenAPI spec with an interactive request playground
- Redirect the root (`/`) to the Ordre marketing site (the docs app has no landing page of its own)
- Expose raw guide markdown for LLM/agent consumption

The root (`/`) redirects to the marketing site - `ordre.localhost` locally, `ordre-marketing.vercel.app` on preview, and `ordre.app` in production (see `marketingUrl()` in `src/lib/shared.ts`).

---

## 📁 Structure

```
apps/docs/
├── content/
│   ├── docs/                      # Guide MDX (rendered at /internal-docs)
│   │   └── meta.json              # Guide navigation order
│   └── api-docs/                  # Generated API MDX (gitignored)
│
├── src/
│   ├── app/
│   │   ├── page.tsx               # Root redirect to the marketing site
│   │   ├── internal-docs/         # Guides layout and [[...slug]] pages
│   │   ├── api-docs/              # API reference layout, landing, and pages
│   │   └── api/search/route.ts    # Search route handler
│   │
│   ├── lib/
│   │   ├── source.ts              # source (guides) and apiSource (API) loaders
│   │   ├── openapi.ts             # createOpenAPI server instance
│   │   ├── layout.shared.tsx      # Shared nav/layout options
│   │   └── shared.ts              # Routes + marketingUrl()
│   │
│   ├── components/api-page.tsx    # APIPage component for the generated MDX
│   └── proxy.ts                   # Serves raw guide markdown (/page.md, Accept)
│
├── scripts/generate-api-docs.ts   # Generates the API MDX from public/openapi.json
├── source.config.ts
├── next.config.ts
└── package.json
```

---

## 🧰 Tech Stack

**Next.js 16** + **Fumadocs** (`fumadocs-core`, `fumadocs-ui`, `fumadocs-mdx`), with `fumadocs-openapi` generating the API reference from the spec `apps/api` produces.

Everything else - TypeScript, Turborepo, Vitest, ESLint, Prettier, Syncpack - is monorepo-wide; see [Shared Tech Stack](content/docs/engineering/architecture.mdx#-shared-tech-stack).

Full breakdown, alongside this workspace's folder structure: **[Architecture](content/docs/engineering/architecture.mdx#-docs)**.

---

## 🚀 Getting Started

Install and run the whole stack from the repo root - see **[Setup → Running the Project](content/docs/setup/running-the-project.mdx)**. To run only the docs:

```bash
pnpm --filter docs docs:dev
```

`pnpm docs:dev` serves it over HTTPS at **https://docs.ordre.localhost** (via portless); `pnpm docs:dev:app` runs the raw server (OpenAPI watcher + `next dev` together).

---

## 🔍 Scripts

| Command             | Description                                             |
| ------------------- | ------------------------------------------------------- |
| `pnpm docs:dev`     | Start the dev server via portless (HTTPS proxy)         |
| `pnpm docs:dev:app` | Start the raw dev server (OpenAPI watcher + `next dev`) |
| `pnpm docs:openapi` | Generate the API MDX from `public/openapi.json`         |
| `pnpm docs:errors`  | Generate `reference/error-codes.mdx` from `@ordre/core` |
| `pnpm docs:start`   | Serve the production build (run `pnpm build` first)     |
| `pnpm build`        | Production build (`docs:openapi` + `next build`)        |
| `pnpm check-types`  | Generate docs, then `next typegen` + `tsc --noEmit`     |
| `pnpm lint`         | ESLint (fails on warnings)                              |
| `pnpm format`       | Prettier write                                          |
| `pnpm format:check` | Prettier check                                          |

---

## 📝 Guides

Guide pages live in `content/docs` as MDX, grouped into sections by folder. The path
maps straight to the URL - `content/docs/<path>.mdx` is served at
`/internal-docs/<path>`, and `index.mdx` at `/internal-docs`.

**Adding a page:** create the MDX file with `title`, `icon`, and `description`
frontmatter, then add its path to `content/docs/meta.json` - that file (and a
`meta.json` inside each folder) is what controls sidebar order and grouping. A page
missing from `meta.json` renders but is not linked.

Two guides are **generated, not written**, and carry a "do not edit by hand" banner:

| Page                        | Generated from             | Command             |
| --------------------------- | -------------------------- | ------------------- |
| `reference/error-codes.mdx` | `packages/core/src/errors` | `pnpm docs:errors`  |
| `content/api-docs/**`       | `public/openapi.json`      | `pnpm docs:openapi` |

---

## 🔌 API Reference

The OpenAPI spec is generated from the route registrations in `apps/api`:

```bash
pnpm api:docs:generate   # writes apps/docs/public/openapi.json
```

`fumadocs-openapi` then turns that spec into MDX pages (one per operation) under `content/api-docs`, rendered at `/api-docs`:

```bash
pnpm docs:openapi        # node scripts/generate-api-docs.ts
```

`content/api-docs` is generated (gitignored) and rebuilt automatically on `postinstall`, `build`, and `check-types`. `apps/docs/public/openapi.json` is regenerated by lint-staged whenever files under `apps/api` change.

---

## 📚 Further Reading

- [Root README](../../README.md) - monorepo overview
- [Architecture](content/docs/engineering/architecture.mdx) - monorepo architecture (docs project)
