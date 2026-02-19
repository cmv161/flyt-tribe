import { eq } from "drizzle-orm";
import {
  normalizeAuthRole,
  normalizeAuthScopes,
  normalizeTokenVersion,
  type AuthRole,
  type AuthScope,
} from "@flyt-tribe/auth";

import { users } from "../schema/index";
import { db } from "./index";

export type DbUserAuthClaims = {
  role: AuthRole;
  scopes: AuthScope[];
  tokenVersion: number;
};

export async function getUserAuthClaimsById(userId: string): Promise<DbUserAuthClaims | null> {
  const [user] = await db
    .select({
      role: users.role,
      scopes: users.scopes,
      tokenVersion: users.tokenVersion,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return null;
  }

  return {
    role: normalizeAuthRole(user.role),
    scopes: normalizeAuthScopes(user.scopes),
    tokenVersion: normalizeTokenVersion(user.tokenVersion),
  };
}
