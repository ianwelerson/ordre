# 🎨 @ordre/ui

**Purpose:** Design system for Ordre - atomic components, design tokens, and shared styles used by every app in the monorepo.

---

## 📁 Structure

```
packages/ui/
├── src/
│   ├── button.tsx
│   ├── button.test.tsx
│   ├── card.tsx
│   └── code.tsx
├── eslint.config.ts
├── tsconfig.json
├── vitest.config.ts
└── package.json
```

Components are currently flat in `src/`. As the surface grows they will move into per-component folders following the pattern below:

```
src/components/<Component>/
├── <Component>.tsx
├── <Component>.test.tsx
├── <Component>.stories.tsx
└── index.ts
```

---

## 📦 Exports

Defined in `package.json`:

```jsonc
"exports": {
  "./*": "./src/*.tsx"
}
```

Each component is imported by its file name:

```ts
import { Button } from '@ordre/ui/button';
import { Card } from '@ordre/ui/card';
```

---

## 🧰 Tech Stack

- **Framework**: React 19
- **Styling**: Tailwind CSS v4 (tokens as CSS custom properties - no `tailwind.config.ts`)
- **Testing**: [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/)

---

## 🧱 Constraints

- **No Next.js, React Router, or app-level code.** This package must work in any React consumer.
- **Atomic components only.** Feature-level compositions belong in an app or a future `@ordre/modules` package.
- **No business logic.** Components here know about props and styles, nothing about Ordre's domain.

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

- [Root README](../../README.md) - monorepo overview
- [brand.md](../../../ordre-internal-docs/brand.md) - brand identity and design principles (internal docs)
- [architecture.md](../../../ordre-internal-docs/architecture.md) - package architecture (internal docs)
