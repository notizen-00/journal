import { Controller, Get, Param, Sse, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { EventsService } from "./events.service";

/**
 * Realtime feed for the admin dashboard: sync + build state pushed as it
 * changes, so "Sync Now" / "Build now" reflect progress without the
 * operator reloading the page.
 *
 * Consumed via `fetch()` + a streaming reader rather than `EventSource`,
 * which cannot send an Authorization header — that keeps the JWT out of
 * the URL (and therefore out of access logs).
 */
@ApiTags("events")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("journals/:journalId")
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Sse("events")
  events(@Param("journalId") journalId: string) {
    return this.eventsService.sseStream(journalId);
  }

  /** Same payload as the stream, for the initial render and for polling fallbacks. */
  @Get("snapshot")
  snapshot(@Param("journalId") journalId: string) {
    return this.eventsService.snapshot(journalId);
  }
}