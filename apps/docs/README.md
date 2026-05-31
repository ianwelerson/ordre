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

From the repo root:

```bash
pnpm install
pnpm --filter docs docs:dev
```

Or from this directory:

```bash
pnpm docs:dev
```

`pnpm docs:dev` proxies the app through **[portless](https://www.npmjs.com/package/portless)**, which serves it over HTTPS at a stable local hostname:

**https://docs.ordre.localhost**

Run `pnpm docs:dev:app` to start the raw dev server without portless - it runs the OpenAPI watcher and `next dev` together via `concurrently`.

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

Guide pages live in `content/docs` as MDX. Navigation order is defined in `content/docs/meta.json`. Each page maps to a URL under `/internal-docs`:

| File                 | URL                             |
| -------------------- | ------------------------------- |
| `index.mdx`          | `/internal-docs`                |
| `architecture.mdx`   | `/internal-docs/architecture`   |
| `specs.mdx`          | `/internal-docs/specs`          |
| `infrastructure.mdx` | `/internal-docs/infrastructure` |
| `pricing.mdx`        | `/internal-docs/pricing`        |
| `brand.mdx`          | `/internal-docs/brand`          |
| `roadmap.mdx`        | `/internal-docs/roadmap`        |

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
- [architecture.md](../../../ordre-internal-docs/architecture.md) - monorepo architecture (internal docs)
