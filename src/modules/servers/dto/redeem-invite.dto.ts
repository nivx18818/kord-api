import { IsInt } from 'class-validator';

export class RedeemInviteDto {
  @IsInt()
  userId: number;
}
