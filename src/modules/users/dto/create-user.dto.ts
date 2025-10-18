import { IsDateString, IsEmail, IsOptional, IsString } from "class-validator";

export class CreateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsString()
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsDateString()
  dateOfBirth: string;
}
