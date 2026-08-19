import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ArticlesService } from "./articles.service";

@ApiTags("articles")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Get("journals/:journalId/articles")
  findAll(@Param("journalId") journalId: string, @Query("issueId") issueId?: string) {
    return this.articlesService.findAllForJournal(journalId, { issueId });
  }

  @Get("articles/:id")
  findOne(@Param("id") id: string) {
    return this.articlesService.findOne(id);
  }
}
