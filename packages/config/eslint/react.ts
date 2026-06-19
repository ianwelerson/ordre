import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";
import pluginReactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
// @ts-expect-error force the extension
import { config as baseConfig } from "./base.ts";
import type { Linter } from "eslint";

/**
 * A custom ESLint configuration for React.
 *
 */
export const reactConfig: Linter.Config[] = [
  ...baseConfig,
  js.configs.recommended,
  eslintConfigPrettier,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.serviceworker,
        ...globals.browser,
      },
    },
  },
  {
    plugins: {
      "react-hooks": pluginReactHooks as any,
    },
    rules: {
      ...pluginReactHooks.configs.recommended.rules,
    },
  },
  {
    // Re-enable after the prettier preset above, which turns `curly` off.
    // `"all"` never conflicts with Prettier formatting.
    rules: {
      curly: ["error", "all"],
    },
  },
];
