import { Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { SyncService } from "./sync.service";

@ApiTags("sync")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("journals/:journalId/sync")
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post()
  trigger(@Param("journalId") journalId: string) {
    return this.syncService.triggerSync(journalId);
  }

  @Get("runs")
  runs(@Param("journalId") journalId: string) {
    return this.syncService.findRuns(journalId);
  }

  @Get("status")
  status(@Param("journalId") journalId: string) {
    return this.syncService.findStatus(journalId);
  }
}
