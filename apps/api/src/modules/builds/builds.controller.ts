import { Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { BuildsService } from "./builds.service";

@ApiTags("builds")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class BuildsController {
  constructor(private readonly buildsService: BuildsService) {}

  @Post("journals/:journalId/build")
  trigger(@Param("journalId") journalId: string) {
    return this.buildsService.triggerBuild(journalId);
  }

  @Get("journals/:journalId/builds")
  findAll(@Param("journalId") journalId: string) {
    return this.buildsService.findAllForJournal(journalId);
  }

  @Get("builds/:id")
  findOne(@Param("id") id: string) {
    return this.buildsService.findOne(id);
  }

  @Post("builds/:id/retry")
  retry(@Param("id") id: string) {
    return this.buildsService.retry(id);
  }

  @Post("builds/:id/rollback")
  rollback(@Param("id") id: string) {
    return this.buildsService.rollback(id);
  }
}
