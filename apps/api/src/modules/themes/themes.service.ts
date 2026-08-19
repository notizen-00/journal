import { Injectable } from "@nestjs/common";
import { Prisma } from "@journal/database";
import { PrismaService } from "../../prisma/prisma.service";
import { UpdateThemeSettingsDto } from "./dto/update-theme-settings.dto";

@Injectable()
export class ThemesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.theme.findMany({ orderBy: { name: "asc" } });
  }

  getSettingsForJournal(journalId: string) {
    return this.prisma.themeSetting.findMany({
      where: { journalId },
      include: { theme: true },
    });
  }

  /**
   * Saving theme settings is also how a journal *picks* its theme, so the
   * journal's active `themeId` moves with it. Without this the dropdown
   * silently had no effect: settings rows accumulated per theme while
   * `Journal.themeId` stayed null and the site kept rendering the default.
   */
  upsertSettingsForJournal(journalId: string, dto: UpdateThemeSettingsDto) {
    return this.prisma.$transaction(async (tx) => {
      const setting = await tx.themeSetting.upsert({
        where: { journalId_themeId: { journalId, themeId: dto.themeId } },
        update: { settings: dto.settings as Prisma.InputJsonValue },
        create: { journalId, themeId: dto.themeId, settings: dto.settings as Prisma.InputJsonValue },
      });
      await tx.journal.update({ where: { id: journalId }, data: { themeId: dto.themeId } });
      return setting;
    });
  }
}
