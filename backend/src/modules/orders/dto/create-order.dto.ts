import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Min,
  MinLength,
  MaxLength,
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

  @IsString()
  @MinLength(3)
  recipientName!: string;

  @IsString()
  @Matches(/^\d{11}(\d{3})?$/, {
    message: "Informe um CPF ou CNPJ valido."
  })
  customerDocument!: string;

  @IsString()
  @Matches(/^\d{10,11}$/, {
    message: "Informe um telefone valido com DDD."
  })
  customerPhone!: string;

  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  @IsEnum(ShippingMethod)
  shippingMethod!: ShippingMethod;

  @IsString()
  @MinLength(5)
  shippingAddress!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(20)
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
  @Matches(/^\d{8}$/, {
    message: "Informe um CEP valido com 8 digitos."
  })
  @MinLength(8)
  shippingPostalCode!: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  couponCode?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];
}
