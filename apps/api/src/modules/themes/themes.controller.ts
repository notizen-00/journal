import { Body, Controller, Get, Param, Put, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { UpdateThemeSettingsDto } from "./dto/update-theme-settings.dto";
import { ThemesService } from "./themes.service";

@ApiTags("themes")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class ThemesController {
  constructor(private readonly themesService: ThemesService) {}

  @Get("themes")
  findAll() {
    return this.themesService.findAll();
  }

  @Get("journals/:journalId/theme-settings")
  getSettings(@Param("journalId") journalId: string) {
    return this.themesService.getSettingsForJournal(journalId);
  }

  @Put("journals/:journalId/theme-settings")
  updateSettings(@Param("journalId") journalId: string, @Body() dto: UpdateThemeSettingsDto) {
    return this.themesService.upsertSettingsForJournal(journalId, dto);
  }
}
