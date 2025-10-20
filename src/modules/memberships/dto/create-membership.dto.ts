import { IsInt, IsOptional, IsPositive } from 'class-validator';

export class CreateMembershipDto {
  @IsInt()
  @IsPositive()
  userId: number;

  @IsInt()
  @IsPositive()
  serverId: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  roleId?: number;
}
