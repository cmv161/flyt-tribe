import js from "@eslint/js";
import turboPlugin from "eslint-plugin-turbo";
import tseslint from "typescript-eslint";

/**
 * Shared ESLint config for the repo.
 * @type {import("eslint").Linter.Config[]}
 */
export const config = [
  {
    ignores: [
      "**/.next/**",
      "**/.turbo/**",
      "**/dist/**",
      "**/build/**",
      "**/coverage/**",
      "**/out/**",
      "**/.output/**",
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    plugins: { turbo: turboPlugin },
    rules: { "turbo/no-undeclared-env-vars": "warn" },
  },
];
