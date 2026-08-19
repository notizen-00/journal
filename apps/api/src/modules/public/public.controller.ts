import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../../prisma/prisma.service";
import { InternalTokenGuard } from "./internal-token.guard";

/**
 * Everything the Svelte static builder needs at build time: OAI-harvested
 * data + CMS content + theme settings (PRD §16). Never called from the
 * browser — only from the worker during a build job.
 */
@ApiTags("public-build-feed")
@UseGuards(InternalTokenGuard)
@Controller("public/journals/:journalId")
export class PublicController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  journal(@Param("journalId") journalId: string) {
    return this.prisma.journal.findUnique({
      where: { id: journalId },
      include: { theme: true, themeSettings: true },
    });
  }

  @Get("pages")
  pages(@Param("journalId") journalId: string) {
    return this.prisma.page.findMany({
      where: { journalId, status: "PUBLISHED" },
    });
  }

  @Get("menus")
  menus(@Param("journalId") journalId: string) {
    return this.prisma.menu.findMany({
      where: { journalId },
      include: { items: { orderBy: { order: "asc" } } },
    });
  }

  @Get("articles")
  articles(@Param("journalId") journalId: string) {
    return this.prisma.article.findMany({
      where: { journalId },
      include: { authors: { include: { author: true }, orderBy: { order: "asc" } }, issue: true },
      orderBy: { publicationDate: "desc" },
    });
  }

  @Get("issues")
  issues(@Param("journalId") journalId: string) {
    return this.prisma.issue.findMany({
      where: { journalId },
      include: { articles: true },
      orderBy: { publicationDate: "desc" },
    });
  }
}
