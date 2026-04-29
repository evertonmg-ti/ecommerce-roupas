import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested
} from "class-validator";
import { Type } from "class-transformer";

class AbandonedCartItemDto {
  @IsString()
  productId!: string;

  @IsString()
  @MinLength(2)
  productName!: string;

  @IsString()
  @MinLength(2)
  productSlug!: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  categoryName?: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsNumber()
  @Min(0)
  unitPrice!: number;
}

export class SaveAbandonedCartDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AbandonedCartItemDto)
  items!: AbandonedCartItemDto[];
}
