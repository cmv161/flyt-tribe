import { TRPCError, initTRPC } from "@trpc/server";
import { normalizeTokenVersion, type AuthRole, type AuthScope } from "@flyt-tribe/auth";
import { getUserAuthClaimsById } from "@flyt-tribe/db";
import superjson from "superjson";

export type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: AuthRole | null;
  scopes?: AuthScope[];
  tokenVersion?: number;
};

export type Session = {
  user?: SessionUser | null;
  expires?: string;
} | null;

export type AuthState = "unresolved" | "anonymous" | "authenticated";

export type Context = {
  session: Session;
  user: SessionUser | null;
  authState: AuthState;
  requestIp: string | null;
  requestId: string;
  correlationId: string;
  getSession: () => Promise<Session>;
  getUser: () => Promise<SessionUser | null>;
};

type CreateTRPCContextInput = {
  session?: Session;
  getSession?: () => Promise<Session>;
  requestIp?: string | null;
  requestId?: string;
  correlationId?: string;
};

export function createTRPCContext({
  session,
  getSession,
  requestIp = null,
  requestId = "unknown",
  correlationId = requestId,
}: CreateTRPCContextInput): Context {
  const initialSession = typeof session === "undefined" ? null : session;
  const initialUser = initialSession?.user?.id ? initialSession.user : null;

  let sessionCache = initialSession;
  let userCache = initialUser;
  let isSessionResolved = typeof session !== "undefined";
  let authState: AuthState = initialUser
    ? "authenticated"
    : isSessionResolved
      ? "anonymous"
      : "unresolved";

  async function resolveSession(): Promise<Session> {
    if (isSessionResolved) {
      return sessionCache;
    }

    if (!getSession) {
      isSessionResolved = true;
      sessionCache = null;
      userCache = null;
      authState = "anonymous";
      context.authState = authState;
      return sessionCache;
    }

    sessionCache = await getSession();
    userCache = sessionCache?.user?.id ? sessionCache.user : null;
    isSessionResolved = true;
    authState = userCache ? "authenticated" : "anonymous";
    context.session = sessionCache;
    context.user = userCache;
    context.authState = authState;

    return sessionCache;
  }

  async function resolveUser(): Promise<SessionUser | null> {
    if (userCache?.id) {
      return userCache;
    }

    const resolvedSession = await resolveSession();
    userCache = resolvedSession?.user?.id ? resolvedSession.user : null;
    authState = userCache ? "authenticated" : "anonymous";
    context.user = userCache;
    context.authState = authState;
    return userCache;
  }

  const context: Context = {
    session: sessionCache,
    user: userCache,
    authState,
    requestIp,
    requestId,
    correlationId,
    getSession: resolveSession,
    getUser: resolveUser,
  };

  return context;
}

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

const authMiddleware = t.middleware(async ({ ctx, next }) => {
  const user = ctx.user ?? (await ctx.getUser());

  if (!user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  const session = ctx.session ?? (await ctx.getSession());

  return next({
    ctx: {
      ...ctx,
      session,
      user,
    },
  });
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(authMiddleware);
export const strictProtectedProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const sessionUser = ctx.user ?? (await ctx.getUser());

  if (!sessionUser?.id) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  const freshClaims = await getUserAuthClaimsById(sessionUser.id);

  if (!freshClaims) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  const sessionTokenVersion = normalizeTokenVersion(sessionUser.tokenVersion);

  if (sessionTokenVersion !== freshClaims.tokenVersion) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  const session = ctx.session ?? (await ctx.getSession());
  const user: SessionUser = {
    ...sessionUser,
    role: freshClaims.role,
    scopes: freshClaims.scopes,
    tokenVersion: freshClaims.tokenVersion,
  };

  return next({
    ctx: {
      ...ctx,
      session,
      user,
      authState: "authenticated",
    },
  });
});
export const roleProtectedProcedure = (roles: readonly AuthRole[]) =>
  strictProtectedProcedure.use(({ ctx, next }) => {
    if (!ctx.user?.role || !roles.includes(ctx.user.role)) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    return next();
  });
export const scopeProtectedProcedure = (scopes: readonly AuthScope[]) =>
  strictProtectedProcedure.use(({ ctx, next }) => {
    const userScopes = ctx.user?.scopes ?? [];
    const hasAllScopes = scopes.every((scope) => userScopes.includes(scope));

    if (!hasAllScopes) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    return next();
  });
