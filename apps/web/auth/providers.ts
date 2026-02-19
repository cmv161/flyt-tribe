export const AUTH_PROVIDER_IDS = ["github", "google"] as const;

export type AuthProviderId = (typeof AUTH_PROVIDER_IDS)[number];

export function isAuthProviderId(value: string): value is AuthProviderId {
  return AUTH_PROVIDER_IDS.includes(value as AuthProviderId);
}
