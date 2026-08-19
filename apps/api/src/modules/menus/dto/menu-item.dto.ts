import { IsInt, IsOptional, IsString } from "class-validator";

export class MenuItemDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsString()
  label!: string;

  @IsString()
  url!: string;

  @IsOptional()
  @IsInt()
  order?: number;
}
