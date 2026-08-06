# 📖 storybook

The **storybook** app is the component documentation surface of Ordre. It bundles and renders stories from across the entire monorepo - apps and shared packages alike - into a single browsable site, so the team can review components, views, and states in isolation without running the full apps.

It is built with **[Storybook 10](https://storybook.js.org/)** on the React + Vite framework, and is published as a static site so the team (and future contributors) can review work without a dev environment.

---

## 🧩 Responsibilities

- Aggregate stories from every `apps/*` and `packages/*` workspace and serve them under one URL
- Host MDX documentation pages that accompany the stories
- Deploy as a static build that can be shared with non-technical reviewers

Storybook does not contain product code - it is a thin app whose only job is to load stories from the rest of the monorepo.

---

## 📁 Structure

```
apps/storybook/
├── .storybook/
│   ├── main.ts               # Storybook config (stories glob, addons, Vite tweaks)
│   ├── preview.ts            # Global parameters (story sort, backgrounds, controls)
│   ├── global.css            # Global styles loaded into every story
│   └── shims/                # Local module shims for Storybook/Vite
│
├── DesignTokens/
│   └── Introduction.md       # MDX intro page rendered in the sidebar
│
├── postcss.config.ts
├── turbo.json
└── package.json
```

### Where stories come from

Stories are resolved from across the monorepo - any `*.stories.tsx` or `*.mdx` file in `apps/*` or `packages/*` is picked up by the glob in [`.storybook/main.ts`](./.storybook/main.ts). Adding a new story means creating it next to its component in the relevant workspace; Storybook picks it up automatically.

### Story ordering

`preview.ts` pins the sidebar to **Design Tokens → Components** with an `Introduction` entry first inside each group, so anyone opening Storybook lands on orientation pages before browsing individual stories.

---

## 🧰 Tech Stack

**Storybook 10** on `@storybook/react-vite`, with `@storybook/addon-docs` and `remark-gfm` for MDX tables. Tailwind v4 is wired in through `@tailwindcss/vite`.

Everything else - TypeScript, Turborepo, Vitest, ESLint, Prettier, Syncpack - is monorepo-wide; see [Shared Tech Stack](../docs/content/docs/engineering/architecture.mdx#-shared-tech-stack).

Full breakdown, alongside this workspace's folder structure: **[Architecture](../docs/content/docs/engineering/architecture.mdx#-storybook)**.

---

## 🚀 Getting Started

Install and run the whole stack from the repo root - see **[Setup → Running the Project](../docs/content/docs/setup/running-the-project.mdx)**. To run only Storybook:

```bash
pnpm storybook
```

`pnpm storybook` serves it over HTTPS at **https://storybook.ordre.localhost** (via portless); `pnpm storybook:app` runs the raw Storybook dev server on **http://localhost:6006**.

---

## 🔍 Scripts

| Command                | Description                                            |
| ---------------------- | ------------------------------------------------------ |
| `pnpm storybook`       | Start Storybook in dev mode via portless (HTTPS proxy) |
| `pnpm storybook:app`   | Start the raw Storybook dev server (no portless)       |
| `pnpm storybook:build` | Build the static Storybook site to `storybook-static/` |

---

## 🚢 Deployment

The static build (`storybook-static/`) is deployed to Vercel as part of the monorepo's workflow deployments. See the root [`vercel.json`](../../vercel.json) and [GitHub workflows](../../.github) for the pipeline.

---

## 📚 Further Reading

- [Root README](../../README.md) - monorepo overview
- [Architecture](../docs/content/docs/engineering/architecture.mdx) - monorepo architecture (docs project)
