import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import turboPlugin from "eslint-plugin-turbo";
import tseslint from "typescript-eslint";
import type { Linter } from "eslint";
import { globalIgnores } from "eslint/config";

/**
 * A shared ESLint configuration for the repository.
 * */
export const config: Linter.Config[] = [
  js.configs.recommended,
  eslintConfigPrettier,
  ...tseslint.configs.recommended,
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "coverage/**",
  ]),
  {
    plugins: {
      turbo: turboPlugin,
    },
    rules: {
      "turbo/no-undeclared-env-vars": "warn",
      // Always require curly braces - no `if (condition) return` one-liners.
      curly: ["error", "all"],
    },
  },
  {
    ignores: ["dist/**", "build/**"],
  },
];
