import "server-only";

import { authEnv } from "./auth";
import { assertValidUrl, getRequiredEnv } from "./utils";

const DATABASE_URL = getRequiredEnv("DATABASE_URL");
assertValidUrl("DATABASE_URL", DATABASE_URL);

export const nodeEnv = {
  ...authEnv,
  DATABASE_URL,
} as const;
