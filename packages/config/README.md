# 🧰 @ordre/config

**Purpose:** Shared tooling configurations for the Ordre monorepo - ESLint, TypeScript, and Prettier presets consumed by every app and package.

---

## Table of Contents

- [Structure](#-structure)
- [Exports](#-exports)
- [ESLint](#-eslint)
- [TypeScript](#-typescript)
- [Prettier](#-prettier)
- [Adding a new consumer](#-adding-a-new-consumer)
- [Further Reading](#-further-reading)

---

## 📁 Structure

```
packages/config/
├── eslint/
│   ├── base.ts              # Base config (JS + TS + Turbo, Prettier-compatible)
│   ├── next.ts              # Next.js preset (extends base + React + Next plugin)
│   └── react.ts             # Plain React preset (extends base + React)
│
├── typescript/
│   ├── base.json            # Strict TS baseline
│   ├── nextjs.json          # Next.js override (preserve JSX, noEmit)
│   ├── react-library.json   # Shared React library override
│   └── react-router.json    # React Router v7 (framework mode) override
│
├── prettier/
│   └── index.ts             # Shared Prettier config + import sort rules
│
└── package.json
```

---

## 📦 Exports

Defined in `package.json`:

```jsonc
"exports": {
  "./eslint/next":  "./eslint/next.ts",
  "./eslint/react": "./eslint/react.ts",
  "./typescript/*": "./typescript/*",
  "./prettier":     "./prettier/index.ts"
}
```

| Subpath                      | What it is                             |
| ---------------------------- | -------------------------------------- |
| `@ordre/config/eslint/next`  | ESLint flat config for Next.js apps    |
| `@ordre/config/eslint/react` | ESLint flat config for plain React     |
| `@ordre/config/typescript/*` | TypeScript presets (JSON, via extends) |
| `@ordre/config/prettier`     | Prettier config + import sorting       |

The base ESLint config is internal - consume `next` or `react` instead.

---

## 🧹 ESLint

All presets are **flat configs** targeting ESLint 9.

### Base (`eslint/base.ts`)

- `@eslint/js` recommended rules
- `typescript-eslint` recommended rules
- `eslint-plugin-turbo` - warns on undeclared env vars
- `eslint-config-prettier` - disables stylistic rules that conflict with Prettier
- Ignores `dist/**` and `build/**`

### Next.js (`eslint/next.ts`)

Extends base and adds:

- `eslint-plugin-react` (flat recommended)
- `@next/eslint-plugin-next` (`recommended` + `core-web-vitals`)
- `eslint-plugin-react-hooks`
- Ignores `.next/**`, `out/**`, `build/**`, `next-env.d.ts`
- Disables `react/react-in-jsx-scope` (new JSX transform)

**Usage:**

```ts
// apps/dashboard/eslint.config.ts
import { nextJsConfig } from "@ordre/config/eslint/next";

export default nextJsConfig;
```

### React (`eslint/react.ts`)

Extends base and adds the same React + React Hooks rules as the Next.js preset, but without Next-specific plugins. Targets browser + service worker globals.

**Usage:**

```ts
// apps/board/eslint.config.ts
import { reactConfig } from "@ordre/config/eslint/react";

export default reactConfig;
```

---

## 🟦 TypeScript

All presets extend `base.json` and are consumed via `extends` in a local `tsconfig.json`.

### `base.json`

Strict baseline shared by every preset:

- `strict: true`, `noUncheckedIndexedAccess: true`
- `module`/`moduleResolution`: `NodeNext`
- `target`: `ES2022`
- `declaration` + `declarationMap` enabled
- `isolatedModules`, `moduleDetection: "force"`, `skipLibCheck`

### `nextjs.json`

For Next.js apps. Overrides: `module: "ESNext"`, `moduleResolution: "Bundler"`, `jsx: "preserve"`, `allowJs: true`, `noEmit: true`, and the Next.js TS plugin.

```jsonc
// apps/dashboard/tsconfig.json
{ "extends": "@ordre/config/typescript/nextjs.json" }
```

### `react-library.json`

For shared React packages (e.g. `@ordre/ui`). Overrides: `jsx: "react-jsx"`, `types: ["node"]`.

```jsonc
// packages/ui/tsconfig.json
{ "extends": "@ordre/config/typescript/react-library.json" }
```

### `react-router.json`

For the React Router v7 (framework mode) board app. Overrides: `jsx: "react-jsx"`, `module: "ES2022"`, `moduleResolution: "bundler"`, `verbatimModuleSyntax: true`, `types: ["node", "vite/client"]`, `noEmit: true`.

```jsonc
// apps/board/tsconfig.json
{ "extends": "@ordre/config/typescript/react-router.json" }
```

---

## 🎨 Prettier

The shared config lives in `prettier/index.ts` and ships with `@trivago/prettier-plugin-sort-imports` preconfigured.

**Formatting rules:**

| Option          | Value  |
| --------------- | ------ |
| `printWidth`    | `100`  |
| `tabWidth`      | `2`    |
| `semi`          | `true` |
| `singleQuote`   | `true` |
| `trailingComma` | `es5`  |

**Import order:**

1. CSS side-effect imports
2. Third-party packages (`react`, `next`, anything not starting with `@ordre`/`@`/`.`)
3. `@ordre/*` workspace packages
4. App-level aliases (`@/components`, `@/stores`, `@/locale`, `@/router`, `@/views`)
5. Other `@/` aliases
6. Relative imports

Groups are separated by a blank line and sorted case-insensitively.

**Usage:**

```ts
// apps/dashboard/prettier.config.ts
export { default } from "@ordre/config/prettier";
```

---

## 🔧 Adding a new consumer

1. Add `"@ordre/config": "workspace:*"` to `devDependencies`.
2. Create `eslint.config.ts`, `tsconfig.json`, and `prettier.config.ts` using the snippets above.
3. Run `pnpm lint`, `pnpm check-types`, and `pnpm format:check` locally to verify wiring.
4. Run `pnpm packages:lint` at the repo root - Syncpack will flag any version drift introduced by the new consumer.

---

## 📚 Further Reading

- [Root README](../../README.md) - monorepo overview
- [Architecture](../../apps/docs/content/docs/engineering/architecture.mdx) - package architecture (docs project)
