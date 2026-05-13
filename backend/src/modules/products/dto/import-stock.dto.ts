import { IsString, MinLength } from "class-validator";

export class ImportStockDto {
  @IsString()
  @MinLength(10)
  csvContent!: string;
}
