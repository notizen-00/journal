import { Type } from "class-transformer";
import { IsIn, IsOptional, IsString, ValidateNested } from "class-validator";

class JournalSourceDto {
  @IsString()
  ojsUrl!: string;

  @IsString()
  oaiEndpoint!: string;

  @IsOptional()
  @IsString()
  oaiSetSpec?: string;
}

export class CreateJournalDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  acronym?: string;

  @IsOptional()
  @IsString()
  issn?: string;

  @IsOptional()
  @IsString()
  eissn?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  domain?: string;

  @IsOptional()
  @IsString()
  themeId?: string;

  @IsOptional()
  @IsIn(["ACTIVE", "INACTIVE", "ARCHIVED"])
  status?: "ACTIVE" | "INACTIVE" | "ARCHIVED";

  @IsOptional()
  @ValidateNested()
  @Type(() => JournalSourceDto)
  source?: JournalSourceDto;
}
