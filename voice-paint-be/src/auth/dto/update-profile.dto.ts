import { IsString, IsEmail, IsOptional, MinLength, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  username?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
