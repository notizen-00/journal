import { IsObject, IsString } from "class-validator";

export class UpdateThemeSettingsDto {
  @IsString()
  themeId!: string;

  @IsObject()
  settings!: Record<string, unknown>;
}
