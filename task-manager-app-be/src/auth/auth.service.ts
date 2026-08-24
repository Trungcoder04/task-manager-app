import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  AuthenticationRequest,
  AuthenticationResponse,
  IntrospectRequest,
  IntrospectResponse,
  LogoutRequest,
  RefreshRequest,
} from './dto/auth.dto';
import { AppException } from '../common/errors/app.exception';
import { ErrorCode } from '../common/errors/error-code.enum';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { User } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  userId: number;
  fullName: string;
  email?: string;
  iss: string;
  iat: number;
  exp: number;
  jti: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly signerKey: string;
  private readonly validDuration: number;
  private readonly refreshableDuration: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    this.signerKey = this.configService.get<string>(
      'JWT_SIGNER_KEY',
      '1TjXchw5FloESb63Kc+DFhTARvpWL4jUGCwfGWxuG5SIf/1y/LgJxHnMqaF6A/ij',
    );
    this.validDuration = parseInt(
      this.configService.get<string>('JWT_VALID_DURATION', '3600'),
      10,
    );
    this.refreshableDuration = parseInt(
      this.configService.get<string>('JWT_REFRESHABLE_DURATION', '36000'),
      10,
    );
  }

  async introspect(request: IntrospectRequest): Promise<IntrospectResponse> {
    try {
      await this.verifyToken(request.token, false);
      return { valid: true };
    } catch {
      return { valid: false };
    }
  }

  async authenticate(
    request: AuthenticationRequest,
  ): Promise<AuthenticationResponse> {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ username: request.username }, { email: request.username }],
      },
    });

    if (!user) {
      throw new AppException(ErrorCode.USER_NOT_EXISTED);
    }

    if (user.status === 2) {
      throw new AppException(ErrorCode.ACCOUNT_LOCKED);
    }
    if (user.status === 3) {
      throw new AppException(ErrorCode.ACCOUNT_DISABLED);
    }

    const authenticated = await bcrypt.compare(request.password, user.password);
    if (!authenticated) {
      throw new AppException(ErrorCode.UNAUTHENTICATED);
    }

    const token = await this.generateToken(user);
    return { token, authenticated: true };
  }

  logout(request: LogoutRequest): Promise<void> {
    this.logger.log(
      `User requested logout: ${request.token.substring(0, 10)}...`,
    );
    return Promise.resolve();
  }

  async refreshToken(request: RefreshRequest): Promise<AuthenticationResponse> {
    const payload = await this.verifyToken(request.token, true);
    const username = payload.sub;
    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      throw new AppException(ErrorCode.UNAUTHENTICATED);
    }

    const token = await this.generateToken(user);
    return { token, authenticated: true };
  }

  async verifyRequestToken(token: string): Promise<JwtPayload> {
    return this.verifyToken(token, false);
  }

  private async generateToken(user: User): Promise<string> {
    const now = new Date();
    const exp = new Date(now.getTime() + this.validDuration * 1000);
    const jti = uuidv4();

    const payload: JwtPayload = {
      sub: user.username,
      userId: user.id,
      fullName: user.fullName,
      email: user.email ?? undefined,
      iss: 'task-manager-app',
      iat: Math.floor(now.getTime() / 1000),
      exp: Math.floor(exp.getTime() / 1000),
      jti,
    };

    return this.jwtService.signAsync(payload, {
      secret: this.signerKey,
      algorithm: 'HS512',
    });
  }

  private async verifyToken(
    token: string,
    isRefresh: boolean,
  ): Promise<JwtPayload> {
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.signerKey,
        algorithms: ['HS512'],
      });
    } catch {
      throw new AppException(ErrorCode.UNAUTHENTICATED);
    }

    const iat = payload.iat ? new Date(payload.iat * 1000) : new Date();
    const expiryTime = isRefresh
      ? new Date(iat.getTime() + this.refreshableDuration * 1000)
      : new Date(payload.exp * 1000);

    const now = new Date();
    if (expiryTime <= now) {
      throw new AppException(ErrorCode.UNAUTHENTICATED);
    }

    return payload;
  }
}
