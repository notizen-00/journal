import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class ArticlesService {
  constructor(private readonly prisma: PrismaService) {}

  findAllForJournal(journalId: string, params: { issueId?: string; limit?: number } = {}) {
    return this.prisma.article.findMany({
      where: { journalId, issueId: params.issueId },
      include: { authors: { include: { author: true }, orderBy: { order: "asc" } }, issue: true },
      orderBy: { publicationDate: "desc" },
      take: params.limit,
    });
  }

  async findOne(id: string) {
    const article = await this.prisma.article.findUnique({
      where: { id },
      include: { authors: { include: { author: true }, orderBy: { order: "asc" } }, issue: true },
    });
    if (!article) throw new NotFoundException(`Article ${id} not found`);
    return article;
  }
}
