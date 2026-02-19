import { createTRPCContext } from "@flyt-tribe/api";
import type { AuthRole, AuthScope } from "@flyt-tribe/auth";

import { getValidatedSession } from "@/auth/session";
import type { RequestContext } from "@/lib/request-context";

type WebTRPCSession = {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: AuthRole | null;
    scopes?: AuthScope[];
    tokenVersion?: number;
  } | null;
  expires?: string;
} | null;

function toWebTRPCSession(
  session: Awaited<ReturnType<typeof getValidatedSession>>,
): WebTRPCSession {
  if (!session?.user?.id) {
    return null;
  }

  return {
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
      role: session.user.role,
      scopes: session.user.scopes,
      tokenVersion: session.user.tokenVersion,
    },
    expires: session.expires,
  };
}

export function createWebTRPCContext(requestContext: RequestContext) {
  let cachedSession: WebTRPCSession | undefined;

  async function resolveSession(): Promise<WebTRPCSession> {
    if (typeof cachedSession !== "undefined") {
      return cachedSession;
    }

    cachedSession = toWebTRPCSession(await getValidatedSession());
    return cachedSession;
  }

  return createTRPCContext({
    getSession: resolveSession,
    requestIp: requestContext.requestIp,
    requestId: requestContext.requestId,
    correlationId: requestContext.correlationId,
  });
}
