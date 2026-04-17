import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested
} from "class-validator";
import { Type } from "class-transformer";
import { PaymentMethod, ShippingMethod } from "@prisma/client";

class CreateOrderItemDto {
  @IsString()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CreateOrderDto {
  @IsString()
  @MinLength(3)
  customerName!: string;

  @IsEmail()
  customerEmail!: string;

  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  @IsEnum(ShippingMethod)
  shippingMethod!: ShippingMethod;

  @IsString()
  @MinLength(5)
  shippingAddress!: string;

  @IsOptional()
  @IsString()
  shippingAddress2?: string;

  @IsString()
  @MinLength(2)
  shippingCity!: string;

  @IsString()
  @MinLength(2)
  shippingState!: string;

  @IsString()
  @MinLength(8)
  shippingPostalCode!: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];
}
