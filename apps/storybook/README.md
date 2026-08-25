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

## 🚀 Getting Started

Install and run the whole stack from the repo root - see **[Setup → Running the Project](../docs/content/docs/setup/running-the-project.mdx)**. To run only Storybook:

```bash
pnpm storybook
```

`pnpm storybook` serves it over HTTPS at **https://storybook.ordre.localhost** (via portless); `pnpm storybook:app` runs the raw Storybook dev server on **http://localhost:6006**.

---

## 📚 Further Reading

The stories glob, the sidebar order, and the deployment are documented once in the
docs project:

- [Architecture → storybook](../docs/content/docs/engineering/architecture.mdx#-storybook)
- [Architecture → `@ordre/ui`](../docs/content/docs/engineering/architecture.mdx#ordreui) - the component and story conventions
- [Root README](../../README.md) - monorepo overview
