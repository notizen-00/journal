import { Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@journal/database";
import { PrismaService } from "../../prisma/prisma.service";

export interface FindArticlesParams {
  issueId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

@Injectable()
export class ArticlesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Paginated for the admin dashboard: a harvested journal can hold
   * thousands of articles, so the table pages through them server-side
   * instead of shipping the whole set to the browser.
   */
  async findAllForJournal(journalId: string, params: FindArticlesParams = {}) {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, params.pageSize ?? DEFAULT_PAGE_SIZE));

    const where: Prisma.ArticleWhereInput = {
      journalId,
      ...(params.issueId ? { issueId: params.issueId } : {}),
      ...(params.search
        ? {
            OR: [
              { title: { contains: params.search, mode: "insensitive" } },
              { doi: { contains: params.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        include: { authors: { include: { author: true }, orderBy: { order: "asc" } }, issue: true },
        orderBy: { publicationDate: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.article.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async findOne(id: string) {
    const article = await this.prisma.article.findUnique({
      where: { id },
      include: { authors: { include: { author: true }, orderBy: { order: "asc" } }, issue: true },
    });
    if (!article) throw new NotFoundException(`Article ${id} not found`);
    return article;
  }

  /**
   * The only field on a harvested article the admin can edit — everything
   * else is overwritten by the next sync, so this stays a narrow one-field
   * update rather than a general article PATCH.
   */
  async updateThumbnail(id: string, thumbnailUrl?: string) {
    await this.findOne(id);
    return this.prisma.article.update({
      where: { id },
      data: { thumbnailUrl: thumbnailUrl || null },
    });
  }
}
