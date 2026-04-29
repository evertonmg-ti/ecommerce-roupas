import { ReturnRequestStatus } from "@prisma/client";
import { IsEnum, IsOptional, IsString, MinLength } from "class-validator";

export class UpdateReturnRequestStatusDto {
  @IsEnum(ReturnRequestStatus)
  status!: ReturnRequestStatus;

  @IsOptional()
  @IsString()
  @MinLength(3)
  resolutionNote?: string;
}
