import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, NotFoundException } from "@nestjs/common";
import { Queue } from "bullmq";
import type { OaiHarvestJobData } from "@journal/shared-types";
import { QUEUE_OAI_HARVEST } from "../../config/queues";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class SyncService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(QUEUE_OAI_HARVEST) private readonly harvestQueue: Queue<OaiHarvestJobData>,
  ) {}

  /**
   * Kicks off an OAI harvesting run (PRD §8 - manual "Sync Now"). The run
   * starts from the last successful sync's `finishedAt` so only new/changed
   * records are requested (PRD §9 - Incremental Synchronization).
   */
  async triggerSync(journalId: string) {
    const journal = await this.prisma.journal.findUnique({
      where: { id: journalId },
      include: { source: true },
    });
    if (!journal) throw new NotFoundException(`Journal ${journalId} not found`);
    if (!journal.source) {
      throw new NotFoundException(`Journal ${journalId} has no OJS/OAI source configured`);
    }

    const lastSuccessful = await this.prisma.syncRun.findFirst({
      where: { journalId, status: "SUCCESS" },
      orderBy: { finishedAt: "desc" },
    });

    const syncRun = await this.prisma.syncRun.create({
      data: {
        journalId,
        status: "PENDING",
        fromDate: lastSuccessful?.finishedAt ?? null,
      },
    });

    await this.harvestQueue.add(
      "harvest",
      { syncRunId: syncRun.id, journalId },
      { removeOnComplete: 100, removeOnFail: 100 },
    );

    return syncRun;
  }

  findRuns(journalId: string) {
    return this.prisma.syncRun.findMany({
      where: { journalId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  async findStatus(journalId: string) {
    const latest = await this.prisma.syncRun.findFirst({
      where: { journalId },
      orderBy: { createdAt: "desc" },
    });
    return latest ?? { status: "NEVER_RUN" };
  }
}
