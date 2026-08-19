import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class UserCreationRequest {
  @MinLength(4, { message: 'USERNAME_INVALID' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @MinLength(6, { message: 'INVALID_PASSWORD' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEmail({}, { message: 'INVALID_EMAIL' })
  @IsOptional()
  email?: string;
}
