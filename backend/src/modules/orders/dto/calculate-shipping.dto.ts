import { IsEnum, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { Type } from "class-transformer";
import { ShippingMethod } from "@prisma/client";

export class CalculateShippingDto {
  @IsEnum(ShippingMethod)
  shippingMethod!: ShippingMethod;

  @IsString()
  postalCode!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  subtotal?: number;
}
