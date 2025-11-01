import { IsInt, IsPositive } from 'class-validator';

export class AddParticipantDto {
  @IsInt()
  @IsPositive()
  userId: number;
}
