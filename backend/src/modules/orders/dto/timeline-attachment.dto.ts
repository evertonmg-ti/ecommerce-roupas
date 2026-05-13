import { IsInt, IsString, Max, Min, MinLength } from "class-validator";

export class TimelineAttachmentDto {
  @IsString()
  @MinLength(1)
  fileName!: string;

  @IsString()
  @MinLength(3)
  mimeType!: string;

  @IsInt()
  @Min(1)
  @Max(2 * 1024 * 1024)
  sizeBytes!: number;

  @IsString()
  @MinLength(30)
  dataUrl!: string;
}
