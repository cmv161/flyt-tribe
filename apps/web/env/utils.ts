import "server-only";

export function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getOptionalEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

export function assertValidUrl(name: string, value: string): void {
  try {
    new URL(value);
  } catch {
    throw new Error(`${name} must be a valid URL`);
  }
}
