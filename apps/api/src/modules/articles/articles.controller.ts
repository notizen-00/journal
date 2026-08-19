import { Body, Controller, Get, Param, Patch, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ArticlesService } from "./articles.service";
import { UpdateArticleThumbnailDto } from "./dto/update-article-thumbnail.dto";

/** Returns undefined for missing or non-numeric values so defaults apply. */
function toPositiveInt(value?: string): number | undefined {
  if (value === undefined || value === "") return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

@ApiTags("articles")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Get("journals/:journalId/articles")
  findAll(
    @Param("journalId") journalId: string,
    @Query("issueId") issueId?: string,
    @Query("search") search?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
  ) {
    // Coerced here rather than with ParseIntPipe: paging params are optional,
    // and the pipe rejects a request that simply omits them.
    return this.articlesService.findAllForJournal(journalId, {
      issueId,
      search,
      page: toPositiveInt(page),
      pageSize: toPositiveInt(pageSize),
    });
  }

  @Get("articles/:id")
  findOne(@Param("id") id: string) {
    return this.articlesService.findOne(id);
  }

  @Patch("articles/:id/thumbnail")
  updateThumbnail(@Param("id") id: string, @Body() dto: UpdateArticleThumbnailDto) {
    return this.articlesService.updateThumbnail(id, dto.thumbnailUrl);
  }
}
