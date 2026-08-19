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

  upsertSettingsForJournal(journalId: string, dto: UpdateThemeSettingsDto) {
    return this.prisma.themeSetting.upsert({
      where: { journalId_themeId: { journalId, themeId: dto.themeId } },
      update: { settings: dto.settings as Prisma.InputJsonValue },
      create: { journalId, themeId: dto.themeId, settings: dto.settings as Prisma.InputJsonValue },
    });
  }
}
