import { IsInt, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateAttachmentDto {
  @IsUrl()
  url: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsInt()
  size?: number;

  @IsInt()
  messageId: number;
}
