import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@journal/database";
import { PrismaService } from "../../prisma/prisma.service";
import { CreatePageDto } from "./dto/create-page.dto";
import { UpdatePageDto } from "./dto/update-page.dto";

@Injectable()
export class PagesService {
  constructor(private readonly prisma: PrismaService) {}

  findAllForJournal(journalId: string) {
    return this.prisma.page.findMany({
      where: { journalId },
      orderBy: { updatedAt: "desc" },
    });
  }

  async findOne(id: string) {
    const page = await this.prisma.page.findUnique({
      where: { id },
      include: { versions: { orderBy: { version: "desc" }, take: 10 } },
    });
    if (!page) throw new NotFoundException(`Page ${id} not found`);
    return page;
  }

  create(journalId: string, dto: CreatePageDto) {
    return this.prisma.page.create({
      data: {
        journalId,
        slug: dto.slug,
        title: dto.title,
        blocks: (dto.blocks ?? []) as Prisma.InputJsonValue,
        status: dto.status ?? "DRAFT",
      },
    });
  }

  async update(id: string, dto: UpdatePageDto) {
    await this.findOne(id);
    return this.prisma.page.update({
      where: { id },
      data: {
        slug: dto.slug,
        title: dto.title,
        blocks: dto.blocks as Prisma.InputJsonValue | undefined,
        status: dto.status,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.page.delete({ where: { id } });
    return { id, deleted: true };
  }

  /**
   * Publishing snapshots the current blocks into an immutable PageVersion
   * (PRD §22 - Versioning/Rollback) and flips the page to PUBLISHED. Actual
   * static regeneration is triggered separately via the builds module.
   */
  async publish(id: string) {
    const page = await this.findOne(id);
    const lastVersion = await this.prisma.pageVersion.findFirst({
      where: { pageId: id },
      orderBy: { version: "desc" },
    });
    const nextVersion = (lastVersion?.version ?? 0) + 1;

    const [, updated] = await this.prisma.$transaction([
      this.prisma.pageVersion.create({
        data: {
          pageId: id,
          version: nextVersion,
          contentJson: (page.blocks ?? []) as Prisma.InputJsonValue,
          status: "PUBLISHED",
        },
      }),
      this.prisma.page.update({
        where: { id },
        data: { status: "PUBLISHED" },
      }),
    ]);

    return updated;
  }

  async rollback(id: string, version: number) {
    const target = await this.prisma.pageVersion.findUnique({
      where: { pageId_version: { pageId: id, version } },
    });
    if (!target) throw new NotFoundException(`Version ${version} not found for page ${id}`);

    return this.prisma.page.update({
      where: { id },
      data: { blocks: target.contentJson as Prisma.InputJsonValue, status: "PUBLISHED" },
    });
  }
}
