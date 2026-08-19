import { IsOptional, IsString } from "class-validator";

export class UpdateArticleThumbnailDto {
  /** Cleared by sending an empty string. */
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;
}
