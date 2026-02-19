import { existsSync } from "node:fs";
import { resolve } from "node:path";

import {
  createStructuredLogger,
  isAuthScope,
  normalizeAuthScopes,
  type AuthScope,
} from "@flyt-tribe/auth";
import { config as loadEnv } from "dotenv";

const logger = createStructuredLogger("db-auth-bootstrap-cli");
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type ParsedArgs = {
  userId?: string;
  scopes: string[];
  confirm?: string;
  envFile?: string;
  databaseUrl?: string;
  help: boolean;
};

type DatabaseFingerprint = {
  host: string;
  database: string;
  user: string;
  schema: string;
  value: string;
};

function assertValidDatabaseUrl(name: string, value: string): void {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(value);
  } catch {
    throw new Error(`${name} must be a valid URL`);
  }

  if (parsedUrl.protocol !== "postgresql:" && parsedUrl.protocol !== "postgres:") {
    throw new Error(`${name} must use postgresql:// or postgres:// protocol`);
  }
}

function readDatabaseFingerprint(databaseUrl: string): DatabaseFingerprint {
  const parsedUrl = new URL(databaseUrl);
  const host = parsedUrl.port ? `${parsedUrl.hostname}:${parsedUrl.port}` : parsedUrl.hostname;
  const database = decodeURIComponent(parsedUrl.pathname.replace(/^\/+/, "")) || "unknown";
  const user = decodeURIComponent(parsedUrl.username) || "unknown";
  const schema = parsedUrl.searchParams.get("schema")?.trim() || "public";
  const value = `${host}/${database}/${user}/${schema}`;

  return {
    host,
    database,
    user,
    schema,
    value,
  };
}

function loadDatabaseUrlFromEnvFile(envFile: string): string {
  const resolvedEnvPath = resolve(process.cwd(), envFile);

  if (!existsSync(resolvedEnvPath)) {
    throw new Error(`Env file not found: ${resolvedEnvPath}`);
  }

  loadEnv({ path: resolvedEnvPath, override: true });

  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error(`DATABASE_URL is not set in env file: ${resolvedEnvPath}`);
  }

  assertValidDatabaseUrl("DATABASE_URL", databaseUrl);
  return databaseUrl;
}

function resolveDatabaseUrl(parsedArgs: ParsedArgs): string {
  if (parsedArgs.databaseUrl && parsedArgs.envFile) {
    throw new Error("Use only one source: --database-url or --env-file");
  }

  if (!parsedArgs.databaseUrl && !parsedArgs.envFile) {
    throw new Error("Missing required source: provide --database-url or --env-file");
  }

  if (parsedArgs.databaseUrl) {
    const databaseUrl = parsedArgs.databaseUrl.trim();
    assertValidDatabaseUrl("--database-url", databaseUrl);
    process.env.DATABASE_URL = databaseUrl;
    return databaseUrl;
  }

  const envFile = parsedArgs.envFile?.trim();
  if (!envFile) {
    throw new Error("Invalid --env-file value");
  }

  const databaseUrl = loadDatabaseUrlFromEnvFile(envFile);
  process.env.DATABASE_URL = databaseUrl;
  return databaseUrl;
}

function assertConfirmMatchesTarget(
  confirmValue: string | undefined,
  fingerprint: DatabaseFingerprint,
): string {
  const normalizedConfirm = confirmValue?.trim();

  if (!normalizedConfirm) {
    throw new Error(
      `Missing required --confirm value. It must include database name '${fingerprint.database}' or full fingerprint '${fingerprint.value}'`,
    );
  }

  const confirmLower = normalizedConfirm.toLowerCase();
  const databaseLower = fingerprint.database.toLowerCase();
  const fingerprintLower = fingerprint.value.toLowerCase();

  if (!confirmLower.includes(databaseLower) && !confirmLower.includes(fingerprintLower)) {
    throw new Error(
      `--confirm must include database name '${fingerprint.database}' or full fingerprint '${fingerprint.value}'`,
    );
  }

  return normalizedConfirm;
}

function parseArgs(argv: string[]): ParsedArgs {
  const parsed: ParsedArgs = {
    scopes: [],
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg) {
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      parsed.help = true;
      continue;
    }

    if (arg === "--confirm") {
      const confirmValue = argv[index + 1];
      if (!confirmValue || confirmValue.startsWith("--")) {
        throw new Error("--confirm requires a value");
      }
      parsed.confirm = confirmValue;
      index += 1;
      continue;
    }

    if (arg.startsWith("--confirm=")) {
      parsed.confirm = arg.slice("--confirm=".length);
      continue;
    }

    if (arg === "--user-id") {
      parsed.userId = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg.startsWith("--user-id=")) {
      parsed.userId = arg.slice("--user-id=".length);
      continue;
    }

    if (arg === "--env-file") {
      parsed.envFile = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg.startsWith("--env-file=")) {
      parsed.envFile = arg.slice("--env-file=".length);
      continue;
    }

    if (arg === "--database-url") {
      parsed.databaseUrl = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg.startsWith("--database-url=")) {
      parsed.databaseUrl = arg.slice("--database-url=".length);
      continue;
    }

    if (arg === "--scope") {
      const scope = argv[index + 1];
      if (scope) {
        parsed.scopes.push(scope);
      }
      index += 1;
      continue;
    }

    if (arg.startsWith("--scope=")) {
      parsed.scopes.push(arg.slice("--scope=".length));
      continue;
    }

    if (arg === "--scopes") {
      const scopesValue = argv[index + 1];
      if (scopesValue) {
        parsed.scopes.push(...scopesValue.split(","));
      }
      index += 1;
      continue;
    }

    if (arg.startsWith("--scopes=")) {
      parsed.scopes.push(...arg.slice("--scopes=".length).split(","));
    }
  }

  return parsed;
}

function assertValidUserId(userId: string | undefined): string {
  const normalizedUserId = userId?.trim();

  if (!normalizedUserId) {
    throw new Error("Missing required --user-id <uuid> argument");
  }

  if (!UUID_PATTERN.test(normalizedUserId)) {
    throw new Error("Invalid --user-id value. Expected UUID");
  }

  return normalizedUserId;
}

function normalizeScopes(rawScopes: string[]): AuthScope[] {
  const scopes = rawScopes.map((scope) => scope.trim()).filter(Boolean);
  const invalidScopes = scopes.filter((scope) => !isAuthScope(scope));

  if (invalidScopes.length > 0) {
    throw new Error(`Invalid scopes: ${invalidScopes.join(", ")}`);
  }

  return normalizeAuthScopes(scopes);
}

function printUsage(): void {
  console.info("Usage:");
  console.info(
    "  pnpm auth:bootstrap-admin -- --user-id <uuid> --database-url <postgres-url> --confirm <db-or-fingerprint> [--scopes auth:read,auth:write]",
  );
  console.info(
    "  pnpm auth:bootstrap-admin -- --user-id <uuid> --env-file apps/web/.env.local --confirm <db-or-fingerprint> --scope auth:read",
  );
}

async function main(): Promise<void> {
  const parsedArgs = parseArgs(process.argv.slice(2));

  if (parsedArgs.help) {
    printUsage();
    return;
  }

  const databaseUrl = resolveDatabaseUrl(parsedArgs);
  const fingerprint = readDatabaseFingerprint(databaseUrl);
  const userId = assertValidUserId(parsedArgs.userId);
  const scopes = normalizeScopes(parsedArgs.scopes);
  const confirmValue = assertConfirmMatchesTarget(parsedArgs.confirm, fingerprint);

  console.info("Bootstrap target fingerprint:");
  console.info(`  host: ${fingerprint.host}`);
  console.info(`  db: ${fingerprint.database}`);
  console.info(`  user: ${fingerprint.user}`);
  console.info(`  schema: ${fingerprint.schema}`);
  console.info(`  fingerprint: ${fingerprint.value}`);
  console.info(`  confirm: ${confirmValue}`);

  const { bootstrapFirstAdminAndRevokeSessions } = await import("../client/user-auth-admin");

  const bootstrapResult = await bootstrapFirstAdminAndRevokeSessions({
    userId,
    scopes,
  });

  if (bootstrapResult.status === "already_initialized") {
    logger.security("auth.bootstrap.fail", {
      userId,
      scopesCount: scopes.length,
      reason: "already_initialized",
      databaseFingerprint: fingerprint.value,
    });
    throw new Error("Bootstrap skipped: an admin user already exists");
  }

  if (bootstrapResult.status === "user_not_found") {
    logger.security("auth.bootstrap.fail", {
      userId,
      scopesCount: scopes.length,
      reason: "user_not_found",
      databaseFingerprint: fingerprint.value,
    });
    throw new Error("Bootstrap failed: target user was not found");
  }

  logger.security("auth.bootstrap.success", {
    userId,
    role: bootstrapResult.claims.role,
    scopesCount: bootstrapResult.claims.scopes.length,
    tokenVersion: bootstrapResult.claims.tokenVersion,
    source: "cli",
    databaseFingerprint: fingerprint.value,
  });

  console.info(`Bootstrap completed for user ${userId}`);
}

void main().catch((error: unknown) => {
  logger.security("auth.bootstrap.fail", {
    reason: "runtime_error",
    error: error instanceof Error ? error.message : String(error),
    source: "cli",
  });

  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
