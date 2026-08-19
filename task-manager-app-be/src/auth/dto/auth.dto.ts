import { IsNotEmpty, IsString } from 'class-validator';

export class AuthenticationRequest {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class AuthenticationResponse {
  token: string;
  authenticated: boolean;
}

export class IntrospectRequest {
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class IntrospectResponse {
  valid: boolean;
}

export class RefreshRequest {
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class LogoutRequest {
  @IsString()
  @IsNotEmpty()
  token: string;
}
