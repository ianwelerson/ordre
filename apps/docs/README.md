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

## 🧰 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Docs engine**: [Fumadocs](https://fumadocs.dev) - `fumadocs-core`, `fumadocs-ui`, `fumadocs-mdx`
- **API reference**: [`fumadocs-openapi`](https://fumadocs.dev/docs/ui/openapi) - generates MDX from the OpenAPI spec
- **UI**: React 19, Tailwind CSS v4
- **Local proxy**: [portless](https://www.npmjs.com/package/portless) - serves the app over HTTPS in development

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
| `pnpm docs:start`   | Serve the production build (run `pnpm build` first)     |
| `pnpm build`        | Production build (`docs:openapi` + `next build`)        |
| `pnpm check-types`  | Generate docs, then `next typegen` + `tsc --noEmit`     |
| `pnpm lint`         | ESLint (fails on warnings)                              |
| `pnpm format`       | Prettier write                                          |
| `pnpm format:check` | Prettier check                                          |

---

## 📝 Guides

Guide pages live in `content/docs` as MDX, grouped into sections by folder. Navigation order is defined in `content/docs/meta.json` (and a `meta.json` inside each folder). Pages map to URLs under `/internal-docs`:

| Path                             | URL                                          |
| -------------------------------- | -------------------------------------------- |
| `index.mdx`                      | `/internal-docs`                             |
| `setup/*`                        | `/internal-docs/setup/*`                     |
| `design/brand.mdx`               | `/internal-docs/design/brand`                |
| `product/specs.mdx`              | `/internal-docs/product/specs`               |
| `product/pricing.mdx`            | `/internal-docs/product/pricing`             |
| `product/roadmap/*`              | `/internal-docs/product/roadmap/*`           |
| `engineering/architecture.mdx`   | `/internal-docs/engineering/architecture`    |
| `engineering/data-model.mdx`     | `/internal-docs/engineering/data-model`      |
| `engineering/authorization/*`    | `/internal-docs/engineering/authorization/*` |
| `engineering/infrastructure.mdx` | `/internal-docs/engineering/infrastructure`  |
| `reference/*`                    | `/internal-docs/reference/*`                 |

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
