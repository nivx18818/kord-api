import { IsArray, IsInt, IsPositive } from 'class-validator';

export class RemoveRolesDto {
  @IsArray()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  roleIds: number[];
}
