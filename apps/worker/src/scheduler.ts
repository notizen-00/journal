import { Queue } from "bullmq";
import type { OaiHarvestJobData } from "@journal/shared-types";
import { QUEUE_OAI_HARVEST } from "./config/queues";
import { prisma } from "./prisma";

/**
 * Scheduled OAI sync (PRD §8 - "Every 10 minutes"). Enumerates active
 * journals that have a source configured and enqueues one incremental
 * harvest per journal, same as the manual "Sync Now" button.
 */
export function startAutoSync(harvestQueue: Queue<OaiHarvestJobData>) {
  const intervalMs = process.env.OAI_SYNC_INTERVAL_MS
    ? Number(process.env.OAI_SYNC_INTERVAL_MS)
    : 10 * 60 * 1000;

  const tick = async () => {
    const journals = await prisma.journal.findMany({
      where: { status: "ACTIVE", source: { isNot: null } },
      include: { source: true },
    });

    for (const journal of journals) {
      const lastSuccessful = await prisma.syncRun.findFirst({
        where: { journalId: journal.id, status: "SUCCESS" },
        orderBy: { finishedAt: "desc" },
      });

      const syncRun = await prisma.syncRun.create({
        data: { journalId: journal.id, status: "PENDING", fromDate: lastSuccessful?.finishedAt ?? null },
      });

      await harvestQueue.add(
        "harvest",
        { syncRunId: syncRun.id, journalId: journal.id },
        { removeOnComplete: 100, removeOnFail: 100 },
      );
    }
  };

  const timer = setInterval(() => {
    tick().catch((err) => console.error("[auto-sync] tick failed", err));
  }, intervalMs);

  return () => clearInterval(timer);
}
