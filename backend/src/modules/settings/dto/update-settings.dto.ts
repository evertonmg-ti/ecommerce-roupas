import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min
} from "class-validator";

function toOptionalString(value: unknown) {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(({ value }) => toOptionalString(value))
  storeName?: string;

  @IsOptional()
  @IsUrl()
  @Transform(({ value }) => toOptionalString(value))
  storeUrl?: string;

  @IsOptional()
  @IsEmail()
  @Transform(({ value }) => toOptionalString(value))
  supportEmail?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyRevenueTarget?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  minimumMarginTarget?: number;

  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(({ value }) => toOptionalString(value))
  emailFrom?: string;

  @IsOptional()
  @IsEmail()
  @Transform(({ value }) => toOptionalString(value))
  emailReplyTo?: string;

  @IsOptional()
  @IsEmail()
  @Transform(({ value }) => toOptionalString(value))
  emailOrdersTo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(({ value }) => toOptionalString(value))
  smtpHost?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  smtpPort?: number;

  @IsOptional()
  @IsBoolean()
  smtpSecure?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(({ value }) => toOptionalString(value))
  smtpUser?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(({ value }) => toOptionalString(value))
  smtpPass?: string;
}
