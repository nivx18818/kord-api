import { IsString } from "class-validator";

export class CreateServerDto {
  @IsString()
  name: string;

  @IsString()
  servername: string;
}
