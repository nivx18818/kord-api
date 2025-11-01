import { IsInt, IsOptional, IsString } from 'class-validator';

export class BlockChannelDto {
  @IsInt()
  userId: number;

  @IsOptional()
  @IsString()
  reason?: string;
}
