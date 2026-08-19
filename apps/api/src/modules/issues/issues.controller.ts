import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { IssuesService } from "./issues.service";

@ApiTags("issues")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class IssuesController {
  constructor(private readonly issuesService: IssuesService) {}

  @Get("journals/:journalId/issues")
  findAll(@Param("journalId") journalId: string) {
    return this.issuesService.findAllForJournal(journalId);
  }

  @Get("issues/:id")
  findOne(@Param("id") id: string) {
    return this.issuesService.findOne(id);
  }
}
