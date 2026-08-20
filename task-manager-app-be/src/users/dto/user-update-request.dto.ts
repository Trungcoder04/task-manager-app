import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class UserUpdateRequest {
  @MinLength(6, { message: 'INVALID_PASSWORD' })
  @IsString()
  @IsOptional()
  oldPassword?: string;

  @MinLength(6, { message: 'INVALID_PASSWORD' })
  @IsString()
  @IsOptional()
  password?: string;

  @IsString()
  @IsOptional()
  fullName?: string;

  @IsEmail({}, { message: 'INVALID_EMAIL' })
  @IsOptional()
  email?: string;
}
