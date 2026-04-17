import { IsNumber, IsOptional, IsString, Min } from "class-validator";

export class ValidateCouponDto {
  @IsString()
  code!: string;

  @IsNumber()
  @Min(0)
  subtotal!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  shippingCost?: number;
}
