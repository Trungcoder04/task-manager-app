import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  AuthenticationRequest,
  AuthenticationResponse,
  IntrospectRequest,
  IntrospectResponse,
  LogoutRequest,
  RefreshRequest,
} from './dto/auth.dto';
import { Public } from './decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('token')
  async authenticate(
    @Body() request: AuthenticationRequest,
  ): Promise<AuthenticationResponse> {
    return this.authService.authenticate(request);
  }

  @Public()
  @Post('introspect')
  async introspect(
    @Body() request: IntrospectRequest,
  ): Promise<IntrospectResponse> {
    return this.authService.introspect(request);
  }

  @Public()
  @Post('refresh')
  async refreshToken(
    @Body() request: RefreshRequest,
  ): Promise<AuthenticationResponse> {
    return this.authService.refreshToken(request);
  }

  @Public()
  @Post('logout')
  async logout(@Body() request: LogoutRequest): Promise<void> {
    await this.authService.logout(request);
  }
}
