import { IsInt, IsNotEmpty, IsPositive, IsString } from 'class-validator';

export class CreateReactionDto {
  @IsInt()
  @IsPositive()
  messageId: number;

  @IsInt()
  @IsPositive()
  userId: number;

  @IsString()
  @IsNotEmpty()
  emoji: string;
}
