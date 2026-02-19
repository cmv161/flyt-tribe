import { withBasePath } from "@/lib/base-path";

export const AUTH_ROUTE_PATHS = {
  home: "/",
  dashboard: "/dashboard",
  authApi: "/api/auth",
  signIn: "/api/auth/signin",
} as const;

export function getHomePath(basePath?: string): string {
  return withBasePath(AUTH_ROUTE_PATHS.home, basePath);
}

export function getDashboardPath(basePath?: string): string {
  return withBasePath(AUTH_ROUTE_PATHS.dashboard, basePath);
}

export function getAuthApiPath(basePath?: string): string {
  return withBasePath(AUTH_ROUTE_PATHS.authApi, basePath);
}

export function getSignInPath(basePath?: string): string {
  return withBasePath(AUTH_ROUTE_PATHS.signIn, basePath);
}
