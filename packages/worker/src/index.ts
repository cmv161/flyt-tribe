import "dotenv/config";
import { Worker } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(process.env.REDIS_URL!);

new Worker(
  "nutrition-jobs",
  async (job) => {
    // TODO: nutrient recalculation/aggregation
    return { jobId: job.id, ok: true };
  },
  { connection },
);

console.log("Worker started");
