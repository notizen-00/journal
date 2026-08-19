import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateJournalDto } from "./dto/create-journal.dto";
import { UpdateJournalDto } from "./dto/update-journal.dto";

@Injectable()
export class JournalsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.journal.findMany({
      include: { source: true, theme: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(id: string) {
    const journal = await this.prisma.journal.findUnique({
      where: { id },
      include: { source: true, theme: true },
    });
    if (!journal) throw new NotFoundException(`Journal ${id} not found`);
    return journal;
  }

  create(dto: CreateJournalDto) {
    const { source, ...journalData } = dto;
    return this.prisma.journal.create({
      data: {
        ...journalData,
        source: source ? { create: source } : undefined,
      },
      include: { source: true },
    });
  }

  async update(id: string, dto: UpdateJournalDto) {
    await this.findOne(id);
    const { source, ...journalData } = dto;
    return this.prisma.journal.update({
      where: { id },
      data: {
        ...journalData,
        source: source
          ? {
              upsert: {
                create: source,
                update: source,
              },
            }
          : undefined,
      },
      include: { source: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.journal.delete({ where: { id } });
    return { id, deleted: true };
  }
}
