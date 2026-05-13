import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
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

class ReturnRequestAttachmentDto {
  @IsString()
  @MinLength(1)
  fileName!: string;

  @IsString()
  @MinLength(3)
  mimeType!: string;

  @IsInt()
  @Min(1)
  @Max(2 * 1024 * 1024)
  sizeBytes!: number;

  @IsString()
  @MinLength(30)
  dataUrl!: string;
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

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(4)
  @ValidateNested({ each: true })
  @Type(() => ReturnRequestAttachmentDto)
  attachments?: ReturnRequestAttachmentDto[];
}
