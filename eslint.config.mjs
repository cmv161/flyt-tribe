import { config as baseConfig } from "@flyt-tribe/eslint-config/base";

/** @type {import("eslint").Linter.Config} */
export default [
  {
    ignores: ["apps/**", "packages/**"],
  },
  ...baseConfig,
];
