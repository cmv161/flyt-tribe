import { Worker } from "bullmq";
import IORedis from "ioredis";
import { getWorkerEnv } from "./env";

const { REDIS_URL } = getWorkerEnv();
const connection = new IORedis(REDIS_URL);

new Worker(
  "nutrition-jobs",
  async (job) => {
    // TODO: nutrient recalculation/aggregation
    return { jobId: job.id, ok: true };
  },
  { connection },
);

console.log("Worker started");
