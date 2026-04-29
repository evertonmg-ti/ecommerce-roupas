import { IsBoolean, IsOptional, IsString, MinLength } from "class-validator";

export class SaveCustomerAddressDto {
  @IsString()
  @MinLength(2)
  label!: string;

  @IsString()
  @MinLength(3)
  recipientName!: string;

  @IsOptional()
  @IsString()
  customerDocument?: string;

  @IsOptional()
  @IsString()
  customerPhone?: string;

  @IsString()
  @MinLength(5)
  shippingAddress!: string;

  @IsString()
  @MinLength(1)
  shippingNumber!: string;

  @IsOptional()
  @IsString()
  shippingAddress2?: string;

  @IsString()
  @MinLength(2)
  shippingNeighborhood!: string;

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
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsBoolean()
  favoriteForStandard?: boolean;

  @IsOptional()
  @IsBoolean()
  favoriteForExpress?: boolean;

  @IsOptional()
  @IsBoolean()
  favoriteForPickup?: boolean;
}
