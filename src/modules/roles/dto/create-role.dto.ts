import { IsDefined, IsInt, IsString } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  name: string;

  @IsInt()
  serverId: number;

  @IsDefined()
  permissions: Record<string, any>;
}
