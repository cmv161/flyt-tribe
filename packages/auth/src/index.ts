export const AUTH_ROLES = ["user", "admin"] as const;
export const AUTH_SCOPE_REGEX = /^[a-z][a-z0-9-]*:[a-z0-9*.-]+$/;

export type AuthRole = (typeof AUTH_ROLES)[number];
export type AuthScope = `${string}:${string}`;
export type SecurityEventName =
  | "auth.login.success"
  | "auth.login.fail"
  | "auth.link_account.success"
  | "auth.role_change"
  | "auth.bootstrap.success"
  | "auth.bootstrap.fail";
export type StructuredLogLevel = "info" | "warn" | "error";
export type StructuredLogPayload = Record<string, unknown>;

export function isAuthRole(value: unknown): value is AuthRole {
  return typeof value === "string" && AUTH_ROLES.includes(value as AuthRole);
}

export function isAuthScope(value: unknown): value is AuthScope {
  return typeof value === "string" && AUTH_SCOPE_REGEX.test(value);
}

export function normalizeAuthRole(value: unknown): AuthRole {
  return isAuthRole(value) ? value : "user";
}

export function normalizeAuthScopes(value: unknown): AuthScope[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const scopes = value.filter(isAuthScope);
  return Array.from(new Set(scopes));
}

export function normalizeTokenVersion(value: unknown): number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : 0;
}

type StructuredLogger = {
  info: (event: string, payload?: StructuredLogPayload) => void;
  warn: (event: string, payload?: StructuredLogPayload) => void;
  error: (event: string, payload?: StructuredLogPayload) => void;
  security: (event: SecurityEventName, payload?: StructuredLogPayload) => void;
};

function log(
  level: StructuredLogLevel,
  service: string,
  event: string,
  payload: StructuredLogPayload,
): void {
  const record = {
    ts: new Date().toISOString(),
    level,
    service,
    event,
    ...payload,
  };

  if (level === "error") {
    console.error(record);
    return;
  }

  if (level === "warn") {
    console.warn(record);
    return;
  }

  console.info(record);
}

export function createStructuredLogger(service: string): StructuredLogger {
  return {
    info(event, payload = {}) {
      log("info", service, event, payload);
    },
    warn(event, payload = {}) {
      log("warn", service, event, payload);
    },
    error(event, payload = {}) {
      log("error", service, event, payload);
    },
    security(event, payload = {}) {
      log("info", service, event, payload);
    },
  };
}
