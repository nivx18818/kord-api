import { IsInt, IsOptional, IsString } from 'class-validator';

export class MuteUserDto {
  @IsInt()
  targetId: number;

  @IsOptional()
  @IsString()
  reason?: string;
}
