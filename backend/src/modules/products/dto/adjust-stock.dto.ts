import { IsInt, IsOptional, IsString, Max, Min, MinLength } from "class-validator";

export class AdjustStockDto {
  @IsInt()
  @Min(-100000)
  @Max(100000)
  quantityDelta!: number;

  @IsOptional()
  @IsString()
  @MinLength(3)
  reason?: string;
}
