import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@flyt-tribe/db/client";
import { accounts, users } from "@flyt-tribe/db/schema";
import {
  createStructuredLogger,
  normalizeAuthRole,
  normalizeAuthScopes,
  normalizeTokenVersion,
} from "@flyt-tribe/auth";
import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import type { JWT } from "next-auth/jwt";

import { getUserAuthClaims } from "@/auth/claims.node";
import authConfig from "@/auth.config";
import { nodeEnv } from "@/env/node";
import { getRequestContext } from "@/lib/request-context";

void nodeEnv.DATABASE_URL;

const authConfigWithOptionalHandlers = authConfig as NextAuthConfig;
const baseJwtCallback = authConfig.callbacks?.jwt;
const baseSignInCallback = authConfigWithOptionalHandlers.callbacks?.signIn;
const baseLinkAccountEvent = authConfigWithOptionalHandlers.events?.linkAccount;
const authClaimsRefreshIntervalMs = nodeEnv.AUTH_CLAIMS_REFRESH_INTERVAL_MS;
const authLogger = createStructuredLogger("web-auth");

function getRequestLogPayload(payload: Record<string, unknown>): Record<string, unknown> {
  const requestContext = getRequestContext();

  return {
    requestId: requestContext?.requestId ?? "unknown",
    correlationId: requestContext?.correlationId ?? "unknown",
    requestIp: requestContext?.requestIp ?? null,
    requestPath: requestContext?.requestPath ?? null,
    requestMethod: requestContext?.requestMethod ?? null,
    ...payload,
  };
}

function isAuthClaimsFresh(token: JWT): boolean {
  if (
    typeof token.authClaimsCheckedAt !== "number" ||
    Date.now() - token.authClaimsCheckedAt > authClaimsRefreshIntervalMs
  ) {
    return false;
  }

  return typeof token.sub === "string";
}

function invalidateToken(token: JWT): JWT {
  token.sub = undefined;
  token.name = undefined;
  token.email = undefined;
  token.picture = undefined;
  token.tokenVersion = undefined;
  token.authClaimsCheckedAt = undefined;
  token.role = null;
  token.scopes = [];

  return token;
}

const nextAuth = NextAuth({
  ...authConfig,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
  }),
  events: {
    ...(authConfigWithOptionalHandlers.events ?? {}),
    async linkAccount(message) {
      if (baseLinkAccountEvent) {
        await baseLinkAccountEvent(message);
      }

      authLogger.security(
        "auth.link_account.success",
        getRequestLogPayload({
          userId: message.user.id,
          provider: message.account.provider,
        }),
      );
    },
  },
  callbacks: {
    ...authConfig.callbacks,
    async signIn(params) {
      try {
        const result = baseSignInCallback ? await baseSignInCallback(params) : true;
        const logPayload = getRequestLogPayload({
          userId: params.user.id ?? null,
          provider: params.account?.provider ?? null,
        });

        if (result === false) {
          authLogger.security("auth.login.fail", {
            ...logPayload,
            reason: "sign_in_rejected",
          });
        } else {
          authLogger.security("auth.login.success", logPayload);
        }

        return result;
      } catch (error) {
        authLogger.security(
          "auth.login.fail",
          getRequestLogPayload({
            userId: params.user.id ?? null,
            provider: params.account?.provider ?? null,
            reason: "sign_in_error",
          }),
        );
        throw error;
      }
    },
    async jwt(params) {
      const token = baseJwtCallback ? await baseJwtCallback(params) : params.token;

      if (!token.sub) {
        return token;
      }

      if (isAuthClaimsFresh(token)) {
        return token;
      }

      const claims = await getUserAuthClaims(token.sub);

      if (!claims) {
        return invalidateToken(token);
      }

      const hasTokenVersion =
        typeof token.tokenVersion === "number" && Number.isInteger(token.tokenVersion);

      if (
        (hasTokenVersion && token.tokenVersion !== claims.tokenVersion) ||
        (!hasTokenVersion && claims.tokenVersion > 0)
      ) {
        return invalidateToken(token);
      }

      token.role = normalizeAuthRole(claims.role);
      token.scopes = normalizeAuthScopes(claims.scopes);
      token.tokenVersion = normalizeTokenVersion(claims.tokenVersion);
      token.authClaimsCheckedAt = Date.now();

      return token;
    },
  },
});

export const { auth, handlers } = nextAuth;
export const { GET, POST } = handlers;
