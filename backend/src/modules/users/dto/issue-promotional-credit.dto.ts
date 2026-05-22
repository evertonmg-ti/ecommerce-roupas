import { IsDateString, IsNumber, IsOptional, IsString, Min, MinLength } from "class-validator";

export class IssuePromotionalCreditDto {
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsDateString()
  expiresAt!: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  description?: string;
}
