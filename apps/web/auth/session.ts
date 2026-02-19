import "server-only";

import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import { normalizeAuthRole, normalizeAuthScopes, normalizeTokenVersion } from "@flyt-tribe/auth";

import { auth } from "@/auth.node";
import { getSignInPath } from "@/auth/routes";

type AuthSession = Session | null;

function getRedirectTarget(callbackPath: string): string {
  const signInPath = getSignInPath();
  return `${signInPath}?callbackUrl=${encodeURIComponent(callbackPath)}`;
}

export async function getValidatedSession(): Promise<AuthSession> {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const sessionTokenVersion = normalizeTokenVersion(session.user.tokenVersion);

  return {
    ...session,
    user: {
      ...session.user,
      role: normalizeAuthRole(session.user.role),
      scopes: normalizeAuthScopes(session.user.scopes),
      tokenVersion: sessionTokenVersion,
    },
  };
}

export async function requireAuthenticatedSession(
  callbackPath: string,
): Promise<NonNullable<AuthSession>> {
  const session = await getValidatedSession();

  if (!session?.user) {
    redirect(getRedirectTarget(callbackPath));
  }

  return session;
}
