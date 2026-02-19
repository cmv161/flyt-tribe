import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

import authCoreConfig from "@/auth.core.config";
import { authEnv } from "@/env/auth";

const providers = [
  ...(authEnv.AUTH_PROVIDERS.github
    ? [
        GitHub({
          clientId: authEnv.AUTH_PROVIDERS.github.clientId,
          clientSecret: authEnv.AUTH_PROVIDERS.github.clientSecret,
        }),
      ]
    : []),
  ...(authEnv.AUTH_PROVIDERS.google
    ? [
        Google({
          clientId: authEnv.AUTH_PROVIDERS.google.clientId,
          clientSecret: authEnv.AUTH_PROVIDERS.google.clientSecret,
        }),
      ]
    : []),
];

const authConfig = {
  ...authCoreConfig,
  providers,
} satisfies NextAuthConfig;

export default authConfig;
