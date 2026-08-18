# 🎨 @ordre/ui

**Purpose:** Design system for Ordre - atomic components, design tokens, fonts, icons, and shared styles used by every app in the monorepo.

Built with React 19 and Tailwind CSS v4 (tokens as CSS custom properties - there is no `tailwind.config.ts`).

---

## 📦 Exports

| Path                       | Contents                                                               |
| -------------------------- | ---------------------------------------------------------------------- |
| `@ordre/ui/components`     | All components, from `src/components/index.ts`                         |
| `@ordre/ui/form`           | The shared form mechanism - `useAppForm`, field binding, error mapping |
| `@ordre/ui/icons`          | The Lucide set plus custom icons                                       |
| `@ordre/ui/styles/*`       | CSS entry points - `main` pulls in fonts, Tailwind, tokens             |
| `@ordre/ui/fonts/*`        | Self-hosted font files                                                 |
| `@ordre/ui/helpers/*`      | Small styling helpers                                                  |
| `@ordre/ui/hooks/*`        | Shared React hooks                                                     |
| `@ordre/ui/config/postcss` | Shared PostCSS config for consuming apps                               |

```ts
import { Button } from '@ordre/ui/components';
```

`@ordre/ui/styles/main` is imported once, in each app's root layout.

## Forms

`@ordre/ui/form` is the mechanism, `src/components/Form/` is the controls. One
schema in, bound fields and a submit out:

```tsx
const { field, submit, rootError, isBusy } = useAppForm({ schema, t });

<form onSubmit={submit(handler)}>
  {rootError && <Alert>{rootError}</Alert>}
  <TextField {...field('email')} label={t('Login.email.label')} />
</form>;
```

It owns the decisions every form would otherwise re-argue: validate `onTouched`
then `onChange`, resolve messages from the keys the schemas emit, put a failed
request's `details` on the named fields and everything else in the banner.

`t` is a **parameter, not a hook call**. The apps do not share an i18n runtime -
the Next apps use `next-intl`, the board uses `i18next` - so a layer that called
either directly could only ever serve two of the three.

---

## 🧱 Constraints

- **No Next.js, React Router, or app-level code.** This package must work in any React consumer.
- **Atomic components only.** Feature-level compositions belong in the app that needs them.
- **No business logic.** Components here know about props and styles, nothing about Ordre's domain.
- **Every component ships with a `.stories.tsx`.** Stories are published to `storybook.ordre.app`; adding a component without one is a review blocker.
- **Every component is exported from `src/components/index.ts`, under a group heading.** Those headings - Primitives, Form, Surfaces, Shell - are the Storybook sidebar folders, so the story's `title` has to match the group the export sits in.

---

## 🧰 Tech Stack

**React 19** and **Tailwind CSS v4** (tokens as CSS custom properties - no `tailwind.config.ts`), with `class-variance-authority` for variants and `lucide-react` for icons.

Everything else - TypeScript, Turborepo, Vitest, ESLint, Prettier, Syncpack - is monorepo-wide; see [Shared Tech Stack](../../apps/docs/content/docs/engineering/architecture.mdx#-shared-tech-stack).

Full breakdown, alongside this workspace's folder structure: **[Architecture](../../apps/docs/content/docs/engineering/architecture.mdx#ordreui)**.

---

## 🔍 Scripts

| Command                   | Description                            |
| ------------------------- | -------------------------------------- |
| `pnpm check-types`        | `tsc --noEmit`                         |
| `pnpm lint`               | ESLint (fails on warnings)             |
| `pnpm format`             | Prettier write                         |
| `pnpm format:check`       | Prettier check                         |
| `pnpm test:unit`          | Vitest with coverage                   |
| `pnpm test:unit:ci`       | Vitest run once (CI)                   |
| `pnpm test:unit:ui`       | Vitest UI                              |
| `pnpm generate:component` | Scaffold a new component via Turbo Gen |

---

## 📚 Further Reading

The folder layout and the per-component file convention are documented once in the docs project:

- [Architecture → `@ordre/ui`](../../apps/docs/content/docs/engineering/architecture.mdx#ordreui)
- [Design → Brand](../../apps/docs/content/docs/design/brand.mdx) - brand identity, color system, and design principles
- [Root README](../../README.md) - monorepo overview
