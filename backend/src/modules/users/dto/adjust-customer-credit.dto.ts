import { IsNumber, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class AdjustCustomerCreditDto {
  @IsNumber()
  amount!: number;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(300)
  description?: string;
}
