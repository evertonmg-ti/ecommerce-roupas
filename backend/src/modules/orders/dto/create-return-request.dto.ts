import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested
} from "class-validator";
import { Type } from "class-transformer";
import { ReturnRequestType } from "@prisma/client";

class ReturnRequestItemDto {
  @IsString()
  orderItemId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CreateReturnRequestDto {
  @IsEnum(ReturnRequestType)
  type!: ReturnRequestType;

  @IsString()
  @MinLength(5)
  reason!: string;

  @IsOptional()
  @IsString()
  details?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReturnRequestItemDto)
  items!: ReturnRequestItemDto[];
}
