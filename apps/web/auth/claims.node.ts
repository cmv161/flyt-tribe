import "server-only";

import { getUserAuthClaimsById } from "@flyt-tribe/db";
import {
  normalizeAuthRole,
  normalizeAuthScopes,
  normalizeTokenVersion,
  type AuthRole,
  type AuthScope,
} from "@flyt-tribe/auth";

export type UserAuthClaims = {
  role: AuthRole;
  scopes: AuthScope[];
  tokenVersion: number;
};

export async function getUserAuthClaims(userId: string): Promise<UserAuthClaims | null> {
  const claims = await getUserAuthClaimsById(userId);

  if (!claims) {
    return null;
  }

  return {
    role: normalizeAuthRole(claims.role),
    scopes: normalizeAuthScopes(claims.scopes),
    tokenVersion: normalizeTokenVersion(claims.tokenVersion),
  };
}
