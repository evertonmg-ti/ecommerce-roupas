import { IsOptional, IsString, MinLength } from "class-validator";

export class SendSegmentCampaignDto {
  @IsString()
  @MinLength(3)
  segment!: string;

  @IsOptional()
  @IsString()
  categorySlug?: string;

  @IsString()
  @MinLength(3)
  subject!: string;

  @IsString()
  @MinLength(10)
  message!: string;
}
