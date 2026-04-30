import { ReturnFinancialStatus, ReturnRequestStatus } from "@prisma/client";
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength
} from "class-validator";

export class UpdateReturnRequestStatusDto {
  @IsEnum(ReturnRequestStatus)
  status!: ReturnRequestStatus;

  @IsOptional()
  @IsString()
  @MinLength(3)
  resolutionNote?: string;

  @IsOptional()
  @IsString()
  reverseLogisticsCode?: string;

  @IsOptional()
  @IsString()
  reverseShippingLabel?: string;

  @IsOptional()
  @IsString()
  @MinLength(5)
  returnDestinationAddress?: string;

  @IsOptional()
  @IsString()
  @MinLength(5)
  reverseInstructions?: string;

  @IsOptional()
  @IsDateString()
  reverseDeadlineAt?: string;

  @IsOptional()
  @IsEnum(ReturnFinancialStatus)
  financialStatus?: ReturnFinancialStatus;

  @IsOptional()
  @IsNumber()
  @Min(0)
  refundAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  storeCreditAmount?: number;

  @IsOptional()
  @IsBoolean()
  restockItems?: boolean;

  @IsOptional()
  @IsString()
  restockNote?: string;
}
