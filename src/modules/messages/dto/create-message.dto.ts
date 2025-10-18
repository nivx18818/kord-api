import { IsDefined, IsInt, IsOptional } from 'class-validator';

export class CreateMessageDto {
  @IsDefined()
  content: Record<string, any>; // JSON payload for rich message content

  @IsInt()
  userId: number;

  @IsInt()
  channelId: number;

  @IsOptional()
  @IsInt()
  parentMessageId?: number;
}
