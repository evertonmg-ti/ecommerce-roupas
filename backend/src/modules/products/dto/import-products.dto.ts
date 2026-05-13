import { IsBoolean, IsOptional, IsString, MinLength } from "class-validator";

export class ImportProductsDto {
  @IsString()
  @MinLength(10)
  csvContent!: string;

  @IsOptional()
  @IsBoolean()
  overwriteExisting?: boolean;
}
