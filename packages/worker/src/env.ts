import "dotenv/config";

type WorkerEnv = {
  REDIS_URL: string;
};

let cachedWorkerEnv: WorkerEnv | undefined;

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function assertValidRedisUrl(name: string, value: string): void {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(value);
  } catch {
    throw new Error(`${name} must be a valid URL`);
  }

  if (parsedUrl.protocol !== "redis:" && parsedUrl.protocol !== "rediss:") {
    throw new Error(`${name} must use redis:// or rediss:// protocol`);
  }
}

export function getWorkerEnv(): WorkerEnv {
  if (cachedWorkerEnv) {
    return cachedWorkerEnv;
  }

  const REDIS_URL = getRequiredEnv("REDIS_URL");
  assertValidRedisUrl("REDIS_URL", REDIS_URL);

  cachedWorkerEnv = {
    REDIS_URL,
  };

  return cachedWorkerEnv;
}
