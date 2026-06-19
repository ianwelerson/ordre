import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";
import pluginReactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import pluginNext from "@next/eslint-plugin-next";
import { config as baseConfig } from "./base.ts";
import { Linter } from "eslint";

/**
 * A custom ESLint configuration for libraries that use Next.js.
 *
 * */
export const nextJsConfig: Linter.Config[] = [
  ...baseConfig,
  js.configs.recommended,
  eslintConfigPrettier,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.serviceworker,
      },
    },
  },
  {
    plugins: {
      "@next/next": pluginNext,
    },
    rules: {
      ...pluginNext.configs.recommended.rules,
      ...pluginNext.configs["core-web-vitals"].rules,
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
