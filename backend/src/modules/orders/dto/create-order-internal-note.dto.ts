import { ArrayMaxSize, IsArray, IsOptional, IsString, MinLength, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { TimelineAttachmentDto } from "./timeline-attachment.dto";

export class CreateOrderInternalNoteDto {
  @IsString()
  @MinLength(3)
  message!: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(4)
  @ValidateNested({ each: true })
  @Type(() => TimelineAttachmentDto)
  attachments?: TimelineAttachmentDto[];
}
