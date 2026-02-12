import { IsOptional, IsString } from 'class-validator';

export class MuteUserDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
