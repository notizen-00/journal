import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class IssuesService {
  constructor(private readonly prisma: PrismaService) {}

  findAllForJournal(journalId: string) {
    return this.prisma.issue.findMany({
      where: { journalId },
      orderBy: { publicationDate: "desc" },
    });
  }

  async findOne(id: string) {
    const issue = await this.prisma.issue.findUnique({
      where: { id },
      include: { articles: true },
    });
    if (!issue) throw new NotFoundException(`Issue ${id} not found`);
    return issue;
  }
}
