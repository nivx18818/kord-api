import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9_.]+$/, {
    message:
      'Username can only contain letters, numbers, underscores, and periods',
  })
  username: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @IsDateString()
  @IsNotEmpty()
  dateOfBirth: string;
}
