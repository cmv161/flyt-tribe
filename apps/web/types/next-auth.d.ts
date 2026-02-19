import type { DefaultSession } from "next-auth";
import type { AuthRole, AuthScope } from "@flyt-tribe/auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role?: AuthRole | null;
      scopes?: AuthScope[];
      tokenVersion?: number;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: AuthRole | null;
    scopes?: AuthScope[];
    tokenVersion?: number;
    authClaimsCheckedAt?: number;
  }
}
