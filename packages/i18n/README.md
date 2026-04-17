# 🌍 @ordre/i18n

**Purpose:** Shared translation strings used across every app in the monorepo. App-specific strings live locally in each app's `shared/i18n/` and are merged with the ones from this package at runtime.

---

## 📁 Structure

```
packages/i18n/
├── messages/
│   ├── app.ts       # Locale-agnostic app constants (name, domain, etc.)
│   ├── en.ts        # Shared English strings
│   ├── pt.ts        # Shared Portuguese strings
│   └── index.ts     # Re-exports { app, en, pt }
└── package.json
```

---

## 📦 Exports

Defined in `package.json`:

```jsonc
"exports": {
  "./messages": "./messages/index.ts"
}
```

| Subpath                | What it is                                       |
| ---------------------- | ------------------------------------------------ |
| `@ordre/i18n/messages` | `{ app, en, pt }` - global constants and strings |

---

## 🧪 Usage

```ts
import { app, en, pt } from "@ordre/i18n/messages";

// Merge shared + app-specific strings
const messages = {
  ...app,
  ...en,
  ...localAppMessages.en,
};
```

Each app is free to structure the merge however its i18n library expects (`next-intl` dictionary, `i18next` resource bundle, etc.).

---

## ➕ Adding a string

1. Add the key to `messages/en.ts`.
2. Add the matching translation to `messages/pt.ts`.
3. If the key is _truly_ shared across apps, keep it here. If it's specific to one app, move it to that app's `shared/i18n/messages/`.

The package is intentionally minimal - only strings that **more than one app uses** belong here.

---

## 📚 Further Reading

- [Root README](../../README.md) - monorepo overview
- [architecture.md](../../../ordre-internal-docs/architecture.md) - i18n architecture (internal docs)
