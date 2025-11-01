import { IsInt, IsOptional, IsString } from 'class-validator';

export class BlockDMDto {
  @IsInt()
  userId: number;

  @IsOptional()
  @IsString()
  reason?: string;
}
