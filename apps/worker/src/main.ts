import { Queue } from "bullmq";
import type { OaiHarvestJobData } from "@journal/shared-types";
import { QUEUE_OAI_HARVEST } from "./config/queues";
import { connectionOptions } from "./redis";
import { createOaiHarvestWorker } from "./processors/oai-harvest.processor";
import { createStaticBuildWorker } from "./processors/static-build.processor";
import { startAutoSync } from "./scheduler";

async function main() {
  const harvestWorker = createOaiHarvestWorker(connectionOptions);
  const buildWorker = createStaticBuildWorker(connectionOptions);

  const harvestQueue = new Queue<OaiHarvestJobData>(QUEUE_OAI_HARVEST, { connection: connectionOptions });
  const stopAutoSync = startAutoSync(harvestQueue);

  harvestWorker.on("failed", (job, err) => console.error(`[oai-harvest] job ${job?.id} failed`, err));
  buildWorker.on("failed", (job, err) => console.error(`[static-build] job ${job?.id} failed`, err));
  harvestWorker.on("completed", (job) => console.log(`[oai-harvest] job ${job.id} completed`));
  buildWorker.on("completed", (job) => console.log(`[static-build] job ${job.id} completed`));

  console.log("Journal Publisher worker started (queues: oai-harvest, static-build)");

  const shutdown = async () => {
    console.log("Worker shutting down...");
    stopAutoSync();
    await Promise.all([harvestWorker.close(), buildWorker.close(), harvestQueue.close()]);
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

main().catch((err) => {
  console.error("Worker failed to start", err);
  process.exit(1);
});
