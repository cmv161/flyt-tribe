import type { NextAuthConfig } from "next-auth";
import {
  normalizeAuthRole,
  normalizeAuthScopes,
  normalizeTokenVersion,
  type AuthRole,
  type AuthScope,
} from "@flyt-tribe/auth";

const NODE_ENV = process.env.NODE_ENV ?? "development";
const DEFAULT_SESSION_MAX_AGE_SECONDS = NODE_ENV === "production" ? 60 * 60 * 24 : 60 * 60 * 24 * 7;
const DEFAULT_SESSION_UPDATE_AGE_SECONDS = NODE_ENV === "production" ? 60 * 15 : 60 * 60 * 24;

function readPositiveIntegerEnv(name: string, fallback: number): number {
  const rawValue = process.env[name]?.trim();

  if (!rawValue) {
    return fallback;
  }

  const parsedValue = Number(rawValue);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }

  return parsedValue;
}

const sessionMaxAgeSeconds = readPositiveIntegerEnv(
  "AUTH_SESSION_MAX_AGE_SECONDS",
  DEFAULT_SESSION_MAX_AGE_SECONDS,
);
const sessionUpdateAgeSeconds = readPositiveIntegerEnv(
  "AUTH_SESSION_UPDATE_AGE_SECONDS",
  DEFAULT_SESSION_UPDATE_AGE_SECONDS,
);

if (sessionUpdateAgeSeconds > sessionMaxAgeSeconds) {
  throw new Error(
    "AUTH_SESSION_UPDATE_AGE_SECONDS must be less than or equal to AUTH_SESSION_MAX_AGE_SECONDS",
  );
}

const authCoreConfig = {
  providers: [],
  session: {
    strategy: "jwt",
    maxAge: sessionMaxAgeSeconds,
    updateAge: sessionUpdateAgeSeconds,
  },
  jwt: {
    maxAge: sessionMaxAgeSeconds,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
      }

      const userClaims = user as
        | {
            role?: AuthRole | null;
            scopes?: AuthScope[];
            tokenVersion?: number | null;
          }
        | undefined;

      if (typeof userClaims?.role !== "undefined") {
        token.role = userClaims.role;
      }

      if (Array.isArray(userClaims?.scopes)) {
        token.scopes = userClaims.scopes;
      }

      if (typeof userClaims?.tokenVersion === "number") {
        token.tokenVersion = userClaims.tokenVersion;
      }

      token.role = normalizeAuthRole(token.role);
      token.scopes = normalizeAuthScopes(token.scopes);
      token.tokenVersion = normalizeTokenVersion(token.tokenVersion);

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role = normalizeAuthRole(token.role);
        session.user.scopes = normalizeAuthScopes(token.scopes);
        session.user.tokenVersion = normalizeTokenVersion(token.tokenVersion);
      }

      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }

      try {
        const targetUrl = new URL(url);

        if (targetUrl.origin === baseUrl) {
          return url;
        }
      } catch {
        return baseUrl;
      }

      return baseUrl;
    },
  },
} satisfies NextAuthConfig;

export default authCoreConfig;
