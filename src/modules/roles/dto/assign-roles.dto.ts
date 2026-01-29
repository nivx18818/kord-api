import { IsArray, IsInt, IsPositive } from 'class-validator';

export class AssignRolesDto {
  @IsArray()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  roleIds: number[];
}
