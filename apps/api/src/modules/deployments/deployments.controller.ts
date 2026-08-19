import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { DeploymentsService } from "./deployments.service";

@ApiTags("deployments")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("journals/:journalId/deployments")
export class DeploymentsController {
  constructor(private readonly deploymentsService: DeploymentsService) {}

  @Get()
  findAll(@Param("journalId") journalId: string) {
    return this.deploymentsService.findAllForJournal(journalId);
  }
}
