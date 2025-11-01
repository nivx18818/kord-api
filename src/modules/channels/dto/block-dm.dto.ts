import { IsInt } from 'class-validator';

export class BlockDMDto {
  @IsInt()
  userId: number;
}
