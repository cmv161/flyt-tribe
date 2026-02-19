import "server-only";

import { isAuthProviderId, type AuthProviderId } from "@/auth/providers";
import { getBasePath, withBasePath } from "@/lib/base-path";

import { assertValidUrl, getOptionalEnv, getRequiredEnv } from "./utils";

const NODE_ENV = process.env.NODE_ENV ?? "development";
const DEFAULT_AUTH_CLAIMS_REFRESH_INTERVAL_MS = NODE_ENV === "production" ? 5_000 : 60_000;
const MAX_AUTH_CLAIMS_REFRESH_INTERVAL_MS = NODE_ENV === "production" ? 30_000 : 300_000;

function readAuthClaimsRefreshIntervalMs(): number {
  const rawValue = getOptionalEnv("AUTH_CLAIMS_REFRESH_INTERVAL_MS");

  if (!rawValue) {
    return DEFAULT_AUTH_CLAIMS_REFRESH_INTERVAL_MS;
  }

  const parsedValue = Number(rawValue);

  if (!Number.isInteger(parsedValue) || parsedValue < 0) {
    throw new Error("AUTH_CLAIMS_REFRESH_INTERVAL_MS must be a non-negative integer");
  }

  if (parsedValue > MAX_AUTH_CLAIMS_REFRESH_INTERVAL_MS) {
    throw new Error(
      `AUTH_CLAIMS_REFRESH_INTERVAL_MS must be less than or equal to ${MAX_AUTH_CLAIMS_REFRESH_INTERVAL_MS}`,
    );
  }

  return parsedValue;
}

function readProviderCredentials(
  providerId: AuthProviderId,
  idEnvName: string,
  secretEnvName: string,
) {
  const clientId = getOptionalEnv(idEnvName);
  const clientSecret = getOptionalEnv(secretEnvName);

  if ((clientId && !clientSecret) || (!clientId && clientSecret)) {
    throw new Error(`${providerId} provider must define both ${idEnvName} and ${secretEnvName}`);
  }

  if (!clientId || !clientSecret) {
    return null;
  }

  return {
    clientId,
    clientSecret,
  };
}

const AUTH_SECRET = getRequiredEnv("AUTH_SECRET");

if (NODE_ENV === "production" && AUTH_SECRET.length < 32) {
  throw new Error("AUTH_SECRET must be at least 32 characters in production");
}

const NEXT_PUBLIC_BASE_PATH = getBasePath();

const AUTH_URL = getOptionalEnv("AUTH_URL");
if (NODE_ENV === "production" && !AUTH_URL) {
  throw new Error("AUTH_URL is required in production");
}

if (AUTH_URL) {
  assertValidUrl("AUTH_URL", AUTH_URL);

  const authUrlPath = new URL(AUTH_URL).pathname.replace(/\/+$/, "") || "/";
  const expectedAuthPath = withBasePath("/api/auth");

  if (authUrlPath !== expectedAuthPath) {
    throw new Error(`AUTH_URL path must be ${expectedAuthPath}`);
  }
}

const github = readProviderCredentials("github", "AUTH_GITHUB_ID", "AUTH_GITHUB_SECRET");
const google = readProviderCredentials("google", "AUTH_GOOGLE_ID", "AUTH_GOOGLE_SECRET");
const authClaimsRefreshIntervalMs = readAuthClaimsRefreshIntervalMs();

const enabledAuthProviders = [
  ...(github ? (["github"] as const) : []),
  ...(google ? (["google"] as const) : []),
];

if (enabledAuthProviders.length === 0) {
  throw new Error("At least one auth provider must be configured");
}

const fallbackProvider = enabledAuthProviders[0];
if (!fallbackProvider) {
  throw new Error("At least one auth provider must be configured");
}

const defaultProviderEnv = getOptionalEnv("AUTH_DEFAULT_PROVIDER");
const authDefaultProvider = defaultProviderEnv ?? fallbackProvider;

if (!isAuthProviderId(authDefaultProvider)) {
  throw new Error(
    `AUTH_DEFAULT_PROVIDER must be one of: github, google. Received: ${authDefaultProvider}`,
  );
}

if (!enabledAuthProviders.includes(authDefaultProvider)) {
  throw new Error(
    `AUTH_DEFAULT_PROVIDER (${authDefaultProvider}) is not configured in environment variables`,
  );
}

export const authEnv = {
  AUTH_DEFAULT_PROVIDER: authDefaultProvider,
  AUTH_PROVIDERS: {
    github,
    google,
  },
  AUTH_CLAIMS_REFRESH_INTERVAL_MS: authClaimsRefreshIntervalMs,
  AUTH_SECRET,
  AUTH_URL,
  ENABLED_AUTH_PROVIDERS: enabledAuthProviders,
  NEXT_PUBLIC_BASE_PATH,
  NODE_ENV,
} as const;
