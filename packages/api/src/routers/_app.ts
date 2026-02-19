import {
  protectedProcedure,
  publicProcedure,
  roleProtectedProcedure,
  router,
  scopeProtectedProcedure,
} from "../core/trpc";
import { TRPCError } from "@trpc/server";
import {
  AUTH_ROLES,
  AUTH_SCOPE_REGEX,
  createStructuredLogger,
  normalizeAuthScopes,
} from "@flyt-tribe/auth";
import { revokeUserSessions, updateUserAuthClaimsAndRevokeSessions } from "@flyt-tribe/db";
import { z } from "zod";

const userIdInput = z.object({
  userId: z.string().uuid(),
});

const authScopeInput = z.string().regex(AUTH_SCOPE_REGEX);

const userAuthorizationInput = z.object({
  userId: z.string().uuid(),
  role: z.enum(AUTH_ROLES),
  scopes: z
    .array(authScopeInput)
    .default([])
    .transform((scopes) => normalizeAuthScopes(scopes)),
});

const securityLogger = createStructuredLogger("api-auth");

export const appRouter = router({
  health: publicProcedure
    .input(z.object({ ping: z.string().optional() }).optional())
    .query(({ input }) => ({
      ok: true,
      ping: input?.ping ?? "pong",
      ts: Date.now(),
    })),
  me: protectedProcedure.query(({ ctx }) => ({
    user: ctx.user,
  })),
  authAccess: scopeProtectedProcedure(["auth:read"]).query(({ ctx }) => ({
    role: ctx.user?.role ?? "user",
    scopes: ctx.user?.scopes ?? [],
  })),
  adminUpdateUserAuthorization: roleProtectedProcedure(["admin"])
    .input(userAuthorizationInput)
    .mutation(async ({ ctx, input }) => {
      const result = await updateUserAuthClaimsAndRevokeSessions({
        userId: input.userId,
        role: input.role,
        scopes: input.scopes,
      });

      if (result.status === "user_not_found") {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      if (result.status === "cannot_demote_last_admin") {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Cannot remove admin role from the last administrator",
        });
      }

      const updatedClaims = result.claims;

      securityLogger.security("auth.role_change", {
        requestId: ctx.requestId,
        correlationId: ctx.correlationId,
        requestIp: ctx.requestIp,
        actorUserId: ctx.user?.id,
        targetUserId: input.userId,
        role: updatedClaims.role,
        scopesCount: updatedClaims.scopes.length,
        tokenVersion: updatedClaims.tokenVersion,
        source: "admin_update_user_authorization",
      });

      return updatedClaims;
    }),
  adminRevokeUserSessions: roleProtectedProcedure(["admin"])
    .input(userIdInput)
    .mutation(async ({ input }) => {
      const tokenVersion = await revokeUserSessions(input.userId);

      if (tokenVersion === null) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      return { tokenVersion };
    }),
});

export type AppRouter = typeof appRouter;
