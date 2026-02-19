import { nextJsConfig } from "@flyt-tribe/eslint-config/next-js";

/** @type {import("eslint").Linter.Config} */
export default [
  ...nextJsConfig,
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/auth",
              message: "Use @/auth/session for app-level checks or @/auth.node for Node handlers.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["**/proxy.ts"],
    rules: {
      "no-restricted-imports": "off",
    },
  },
];
