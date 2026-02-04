import { IsInt } from 'class-validator';

export class FindOrCreateDMDto {
  @IsInt()
  user1Id: number;

  @IsInt()
  user2Id: number;
}
