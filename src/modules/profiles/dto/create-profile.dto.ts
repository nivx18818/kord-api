import { IsInt, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateProfileDto {
  @IsInt()
  userId: number;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsUrl()
  avatar?: string;

  @IsOptional()
  @IsUrl()
  banner?: string;

  @IsOptional()
  @IsString()
  xTwitter?: string;

  @IsOptional()
  @IsString()
  github?: string;

  @IsOptional()
  @IsString()
  linkedin?: string;

  @IsOptional()
  @IsString()
  facebook?: string;

  @IsOptional()
  @IsUrl()
  website?: string;
}
