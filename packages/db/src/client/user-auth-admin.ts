import { eq, sql } from "drizzle-orm";
import {
  normalizeAuthRole,
  normalizeAuthScopes,
  normalizeTokenVersion,
  type AuthRole,
  type AuthScope,
} from "@flyt-tribe/auth";

import { users } from "../schema/index";
import { db } from "./index";

type PersistedUserAuthClaims = {
  role: AuthRole;
  scopes: AuthScope[];
  tokenVersion: number;
};

type BootstrapFirstAdminResult =
  | {
      status: "success";
      claims: PersistedUserAuthClaims;
    }
  | {
      status: "already_initialized";
    }
  | {
      status: "user_not_found";
    };

type RawPersistedUserAuthClaims = {
  role: string;
  scopes: string[];
  tokenVersion: number;
};

const BOOTSTRAP_FIRST_ADMIN_LOCK_ID = 86421357;
const ADMIN_AUTH_UPDATE_LOCK_ID = 86421358;

export type UpdateUserAuthClaimsResult =
  | {
      status: "updated";
      claims: PersistedUserAuthClaims;
    }
  | {
      status: "user_not_found";
    }
  | {
      status: "cannot_demote_last_admin";
    };

function sanitizePersistedClaims(claims: RawPersistedUserAuthClaims): PersistedUserAuthClaims {
  return {
    role: normalizeAuthRole(claims.role),
    scopes: normalizeAuthScopes(claims.scopes),
    tokenVersion: normalizeTokenVersion(claims.tokenVersion),
  };
}

export async function updateUserAuthClaimsAndRevokeSessions(input: {
  userId: string;
  role: AuthRole;
  scopes: AuthScope[];
}): Promise<UpdateUserAuthClaimsResult> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(${ADMIN_AUTH_UPDATE_LOCK_ID})`);

    const [targetUser] = await tx
      .select({
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, input.userId))
      .limit(1);

    if (!targetUser) {
      return { status: "user_not_found" };
    }

    const currentRole = normalizeAuthRole(targetUser.role);

    if (currentRole === "admin" && input.role !== "admin") {
      const [adminCountResult] = await tx
        .select({
          count: sql<number>`count(*)::int`,
        })
        .from(users)
        .where(eq(users.role, "admin"));

      const adminCountRaw = adminCountResult?.count;
      const adminCount =
        typeof adminCountRaw === "number"
          ? adminCountRaw
          : Number.parseInt(String(adminCountRaw ?? "0"), 10);

      if (!Number.isFinite(adminCount) || adminCount <= 1) {
        return { status: "cannot_demote_last_admin" };
      }
    }

    const [updated] = await tx
      .update(users)
      .set({
        role: input.role,
        scopes: input.scopes,
        tokenVersion: sql`${users.tokenVersion} + 1`,
      })
      .where(eq(users.id, input.userId))
      .returning({
        role: users.role,
        scopes: users.scopes,
        tokenVersion: users.tokenVersion,
      });

    if (!updated) {
      return { status: "user_not_found" };
    }

    return {
      status: "updated",
      claims: sanitizePersistedClaims(updated),
    };
  });
}

export async function revokeUserSessions(userId: string): Promise<number | null> {
  const [updated] = await db
    .update(users)
    .set({
      tokenVersion: sql`${users.tokenVersion} + 1`,
    })
    .where(eq(users.id, userId))
    .returning({
      tokenVersion: users.tokenVersion,
    });

  if (!updated) {
    return null;
  }

  return typeof updated.tokenVersion === "number" && Number.isInteger(updated.tokenVersion)
    ? updated.tokenVersion
    : null;
}

export async function hasAnyAdminUser(): Promise<boolean> {
  const [adminUser] = await db
    .select({
      id: users.id,
    })
    .from(users)
    .where(eq(users.role, "admin"))
    .limit(1);

  return Boolean(adminUser?.id);
}

export async function bootstrapFirstAdminAndRevokeSessions(input: {
  userId: string;
  scopes: AuthScope[];
}): Promise<BootstrapFirstAdminResult> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(${BOOTSTRAP_FIRST_ADMIN_LOCK_ID})`);

    const [adminUser] = await tx
      .select({
        id: users.id,
      })
      .from(users)
      .where(eq(users.role, "admin"))
      .limit(1);

    if (adminUser?.id) {
      return { status: "already_initialized" };
    }

    const [updated] = await tx
      .update(users)
      .set({
        role: "admin",
        scopes: input.scopes,
        tokenVersion: sql`${users.tokenVersion} + 1`,
      })
      .where(eq(users.id, input.userId))
      .returning({
        role: users.role,
        scopes: users.scopes,
        tokenVersion: users.tokenVersion,
      });

    if (!updated) {
      return { status: "user_not_found" };
    }

    return {
      status: "success",
      claims: sanitizePersistedClaims(updated),
    };
  });
}
