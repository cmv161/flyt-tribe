import NextAuth from "next-auth";

import authCoreConfig from "@/auth.core.config";

const nextAuth = NextAuth({
  ...authCoreConfig,
});

// Edge-safe auth helper without DB-backed claim validation.
export const { auth: authUnsafe } = nextAuth;
