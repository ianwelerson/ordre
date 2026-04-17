# 🗂️ Ordre

Ordre is a client communication platform for service providers. It gives every job a private, shareable status page that clients can follow in real time - no app download, no account creation, just a link.

> [!NOTE]  
> Ordre is a **study project**. It exists to explore product concepts, libraries, patterns, and monorepo architecture in depth. Some parts are **intentionally overengineered** (layered packages, swappable service interfaces, multi-app setup, etc.) because the goal is to learn by building, not to ship the smallest possible MVP.

## Table of Contents

- [The Idea](#-the-idea)
- [Project Structure](#-project-structure)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Available Scripts](#-available-scripts)
- [Testing](#-testing)
- [Code Quality Standards](#-code-quality-standards)
- [Merging Strategy](#-merging-strategy)
- [License](#-license)

---

## 💡 The Idea

Service professionals spend a lot of time managing client anxiety - answering "any update?" messages, explaining delays, sending photos scattered across threads. Ordre gives every job a single page that the client can open with one link and watch progress unfold: timeline updates, photos, status changes, approvals, and chat, all in one place.

Workspace members create a **board** per job from an industry template, share the link with the client, and post updates. Clients open the link and see everything immediately - sensitive data stays blurred until they verify by email or phone.

For the full product vision (features, personas, design principles), see the [internal docs repo](../ordre-internal-docs/README.md).

---

## 📁 Project Structure

This is a [Turborepo](https://turborepo.com/) + [pnpm workspaces](https://pnpm.io/workspaces) monorepo.

```
ordre/
├── apps/
│   ├── board/          # React Router v7 (SSR) - client-facing board
│   ├── dashboard/      # Next.js - workspace management app
│   └── marketing/      # Next.js - public marketing site
│
├── packages/
│   ├── config/         # Shared ESLint, TypeScript, and Prettier presets
│   ├── i18n/           # Shared translations
│   └── ui/             # React component library
│
├── turbo.json          # Turborepo pipeline
├── pnpm-workspace.yaml # Workspace definition
└── package.json        # Root scripts and dev tooling
```

Apps are runnable; packages are shared. The package layer follows a strict dependency direction - apps depend on packages, packages never depend on apps.

### Apps

| App                               | Description                                                                                               |
| --------------------------------- | --------------------------------------------------------------------------------------------------------- |
| [**board**](./apps/board)         | Client-facing board. React Router v7 in framework mode (SSR) - one board per job, opened via unique link. |
| [**dashboard**](./apps/dashboard) | Authenticated workspace app for managing boards, members, and clients. Built with Next.js.                |
| [**marketing**](./apps/marketing) | Public marketing site (home, pricing, about, legal). Built with Next.js.                                  |

### Packages

| Package                                | Description                                                           |
| -------------------------------------- | --------------------------------------------------------------------- |
| [**@ordre/ui**](./packages/ui)         | React component library - atoms and design tokens shared across apps. |
| [**@ordre/i18n**](./packages/i18n)     | Shared translations merged with app-specific strings at runtime.      |
| [**@ordre/config**](./packages/config) | Shared ESLint, TypeScript, and Prettier presets.                      |

---

## 🧰 Tech Stack

- **Monorepo**: Turborepo + pnpm workspaces
- **Frameworks**: Next.js 16 (dashboard, marketing), React Router v7 framework mode (board)
- **UI**: React 19, Tailwind CSS v4
- **i18n**: `next-intl` (Next apps) and `i18next` + `remix-i18next` (board)
- **Testing**: Vitest + Testing Library; Playwright as the browser provider for Vitest
- **Tooling**: TypeScript, ESLint 9 (flat config), Prettier, Syncpack, Husky + lint-staged, Commitlint

---

## 🚀 Quick Start

### Prerequisites

- **Node.js**: `>=18` (see [`.nvmrc`](./.nvmrc) for the exact version)
- **pnpm**: `10.x` (see `packageManager` in [`package.json`](./package.json))

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/ianwelerson/ordre.git
cd ordre

# 2. Install dependencies
pnpm install

# 3. Start every app in dev mode
pnpm dev
```

Default dev ports:

| App       | URL                   |
| --------- | --------------------- |
| Dashboard | http://localhost:3000 |
| Marketing | http://localhost:3001 |
| Board     | http://localhost:5173 |

Each app also has its own README with app-specific instructions.

---

## 🔍 Available Scripts

Run from the repo root - Turborepo will fan commands out to the right apps and packages.

### Development

| Command      | Description                                |
| ------------ | ------------------------------------------ |
| `pnpm dev`   | Start every app in watch mode              |
| `pnpm build` | Build every app and package for production |

### Code Quality

| Command              | Description                                        |
| -------------------- | -------------------------------------------------- |
| `pnpm lint`          | Run ESLint across the monorepo                     |
| `pnpm format`        | Format everything with Prettier                    |
| `pnpm format:check`  | Verify formatting without writing                  |
| `pnpm check-types`   | Run TypeScript type-checking                       |
| `pnpm packages:lint` | Check dependency versions and `package.json` order |
| `pnpm packages:fix`  | Fix version drift and re-format `package.json`     |

### Testing

| Command             | Description                        |
| ------------------- | ---------------------------------- |
| `pnpm test:unit`    | Run unit tests with coverage       |
| `pnpm test:unit:ci` | Run unit tests once in CI mode     |
| `pnpm test:unit:ui` | Run Vitest with the interactive UI |

---

## 🧪 Testing

- **Framework**: [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/)
- **Browser provider**: [Playwright](https://playwright.dev/) (for component tests that need a real browser)
- **Location**: Tests are colocated with source files (`*.test.ts`, `*.test.tsx`)
- **Coverage**: Enabled by default via `@vitest/coverage-v8`

See each app or package's `vitest.config.ts` for specifics.

---

## 📏 Code Quality Standards

### Pre-commit Hooks

[Husky](https://typicode.github.io/husky/) + [lint-staged](https://github.com/lint-staged/lint-staged) run on every commit:

| File Types      | Actions                                 | Tools             |
| --------------- | --------------------------------------- | ----------------- |
| `*.{js,ts,tsx}` | Format and lint                         | Prettier + ESLint |
| `package.json`  | Validate dependency versions + ordering | Syncpack          |

### Commit Message Convention

All commits follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): message
```

**Allowed types**: `build`, `chore`, `ci`, `docs`, `feat`, `fix`, `perf`, `refactor`, `revert`, `setup`, `style`, `test`.

**Example**: `feat(dashboard): add member invite flow`

---

## 🔀 Merging Strategy

This project uses a **rebase and merge** strategy to keep the history linear.

- Rebase feature branches on top of `develop` before merging
- Avoid merge commits - each commit should be a logical, atomic change
- PR reviews focus on the final shape of the diff, not the path taken to get there

---

## 📝 License

This project is licensed under the **GNU Affero General Public License v3 (AGPLv3)**. You are free to use, modify, and redistribute the code, provided that any derivative works (including those deployed over a network) are also released under the same license.

📄 See the [LICENSE](./LICENSE) file for full details.

---

**Author**: [Ian Welerson](https://ianwelerson.com)
