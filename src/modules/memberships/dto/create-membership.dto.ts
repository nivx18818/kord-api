import { IsArray, IsInt, IsOptional, IsPositive } from 'class-validator';

export class CreateMembershipDto {
  @IsInt()
  @IsPositive()
  userId: number;

  @IsInt()
  @IsPositive()
  serverId: number;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  roleIds?: number[];
}
