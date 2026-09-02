# 🔗 board

The **board** app is the client-facing surface of Ordre. It renders the shareable status page that a client opens from the unique link sent by a workspace member - no login, no account creation, just a URL.

It is built with **[React Router v8](https://reactrouter.com/) in framework mode** (SSR) on Vite. Next.js was not needed here, but SSR is - a client landing on the board should see content on first paint, and OG tags should render for link previews down the road.

---

## 🧩 Responsibilities

- Render the public board page for a given token
- Stream timeline updates and chat messages to the client
- Gate sensitive fields behind email/phone verification
- Handle locale detection via URL prefix, cookie, or `Accept-Language`

Everything that _manages_ boards lives in the [`dashboard`](../dashboard) app - this app is read-first and interaction-light by design.

---

## 🚀 Getting Started

Install and run the whole stack from the repo root - see **[Setup → Running the Project](../docs/content/docs/start/running-the-project.mdx)**. To run only this app:

```bash
pnpm --filter board dev
```

`pnpm dev` serves it over HTTPS at **https://board.ordre.localhost** (via portless); `pnpm dev:app` runs the raw dev server on **http://localhost:5173**.

---

## 📚 Further Reading

The route module layout, the three-folder convention, and the i18n detection order (path prefix → `lng` cookie → header) are documented once in the docs project:

- [Architecture → Board App Structure](../docs/content/docs/architecture/apps.mdx#board)
- [Architecture → i18n Structure](../docs/content/docs/architecture/conventions.mdx#i18n-structure)
- [Root README](../../README.md) - monorepo overview
