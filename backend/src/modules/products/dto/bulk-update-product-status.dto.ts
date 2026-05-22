import { ProductStatus } from "@prisma/client";
import { ArrayMinSize, IsArray, IsEnum, IsString } from "class-validator";

export class BulkUpdateProductStatusDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  ids!: string[];

  @IsEnum(ProductStatus)
  status!: ProductStatus;
}
