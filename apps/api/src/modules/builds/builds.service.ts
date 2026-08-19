import { InjectQueue } from "@nestjs/bullmq";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Queue } from "bullmq";
import type { StaticBuildJobData } from "@journal/shared-types";
import { QUEUE_STATIC_BUILD } from "../../config/queues";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class BuildsService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(QUEUE_STATIC_BUILD) private readonly buildQueue: Queue<StaticBuildJobData>,
  ) {}

  /** Creates a Build record and enqueues the static-build job (PRD §18). */
  async triggerBuild(journalId: string, affectedPaths?: string[]) {
    const journal = await this.prisma.journal.findUnique({ where: { id: journalId } });
    if (!journal) throw new NotFoundException(`Journal ${journalId} not found`);

    const build = await this.prisma.build.create({
      data: { journalId, status: "PENDING" },
    });

    await this.buildQueue.add(
      "build",
      { buildId: build.id, journalId, affectedPaths },
      { removeOnComplete: 100, removeOnFail: 100 },
    );

    return build;
  }

  findAllForJournal(journalId: string) {
    return this.prisma.build.findMany({
      where: { journalId },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { deployment: true },
    });
  }

  async findOne(id: string) {
    const build = await this.prisma.build.findUnique({
      where: { id },
      include: { deployment: true, buildPages: true },
    });
    if (!build) throw new NotFoundException(`Build ${id} not found`);
    return build;
  }

  /** Re-enqueues a failed build as a brand new build attempt (PRD §30). */
  async retry(id: string) {
    const previous = await this.findOne(id);
    return this.triggerBuild(previous.journalId);
  }

  /**
   * Atomic rollback: re-activates a prior successful build's release
   * without rebuilding (PRD §19 - "current -> 102").
   */
  async rollback(id: string) {
    const target = await this.findOne(id);
    if (target.status !== "SUCCESS") {
      throw new BadRequestException(`Cannot roll back to a build that is not SUCCESS`);
    }

    await this.buildQueue.add(
      "rollback",
      { buildId: target.id, journalId: target.journalId, activateOnly: true },
      { removeOnComplete: 100, removeOnFail: 100 },
    );

    return { buildId: target.id, journalId: target.journalId, queued: true };
  }
}
