import { IsInt, IsOptional } from 'class-validator';

export class CreateInviteDto {
  @IsInt()
  createdBy: number;

  @IsOptional()
  @IsInt()
  expiresInDays?: number;
}
