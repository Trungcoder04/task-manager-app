import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MinioService } from '../minio/minio.service';
import { UserCreationRequest } from './dto/user-creation-request.dto';
import { UserUpdateRequest } from './dto/user-update-request.dto';
import { UserResponse } from './dto/user-response.dto';
import { UserUpdateAvatarResponse } from './dto/user-update-avatar-response.dto';
import { AppException } from '../common/errors/app.exception';
import { ErrorCode } from '../common/errors/error-code.enum';
import * as bcrypt from 'bcrypt';
import { Prisma, User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly minioService: MinioService,
  ) {}

  private mapToUserResponse(user: User): UserResponse {
    return {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      email: user.email ?? undefined,
      avatar: user.avatar ?? undefined,
      status: (user as any).status ?? 1,
      role: (user as any).role ?? 2,
      createdAt: user.createdAt,
    };
  }

  async createUser(request: UserCreationRequest): Promise<UserResponse> {
    // Check if username already exists
    const existingUsername = await this.prisma.user.findUnique({
      where: { username: request.username },
    });
    if (existingUsername) {
      throw new AppException(ErrorCode.USER_EXISTED);
    }

    // Check if email already exists (if provided)
    if (request.email) {
      const existingEmail = await this.prisma.user.findUnique({
        where: { email: request.email },
      });
      if (existingEmail) {
        throw new AppException(ErrorCode.EMAIL_EXISTED);
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(request.password, salt);

    const user = await this.prisma.user.create({
      data: {
        username: request.username,
        password: hashedPassword,
        fullName: request.fullName,
        email: request.email ?? null,
      },
    });

    return this.mapToUserResponse(user);
  }

  async getUsers(): Promise<UserResponse[]> {
    const users = await this.prisma.user.findMany({
      orderBy: { id: 'asc' },
    });
    return users.map((u) => this.mapToUserResponse(u));
  }

  async getUser(id: number): Promise<UserResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new AppException(ErrorCode.USER_NOT_EXISTED);
    }

    return this.mapToUserResponse(user);
  }

  async getMyInfo(username: string): Promise<UserResponse> {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      throw new AppException(ErrorCode.USER_NOT_EXISTED);
    }

    return this.mapToUserResponse(user);
  }

  async updateUser(
    userId: number,
    request: UserUpdateRequest,
    authenticatedUsername: string,
  ): Promise<UserResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppException(ErrorCode.USER_NOT_EXISTED);
    }

    const data: Prisma.UserUpdateInput = {};
    if (request.password) {
      if (request.oldPassword) {
        const isOldPasswordValid = await bcrypt.compare(
          request.oldPassword,
          user.password,
        );
        if (!isOldPasswordValid) {
          throw new AppException(ErrorCode.WRONG_OLD_PASSWORD);
        }
      }
      const salt = await bcrypt.genSalt(10);
      data.password = await bcrypt.hash(request.password, salt);
    }
    if (request.fullName !== undefined) {
      data.fullName = request.fullName;
    }
    if (request.email !== undefined) {
      if (request.email && request.email !== user.email) {
        const existingEmail = await this.prisma.user.findUnique({
          where: { email: request.email },
        });
        if (existingEmail && existingEmail.id !== userId) {
          throw new AppException(ErrorCode.EMAIL_EXISTED);
        }
      }
      data.email = request.email ?? null;
    }
    if (request.status !== undefined) {
      (data as any).status = Number(request.status);
    }
    if (request.role !== undefined) {
      (data as any).role = Number(request.role);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data,
    });

    return this.mapToUserResponse(updatedUser);
  }

  async deleteUser(id: number): Promise<void> {
    try {
      await this.prisma.user.delete({
        where: { id },
      });
    } catch (e) {
      console.error('deleteUser Exception', e);
      throw new AppException(ErrorCode.USER_NOT_EXISTED);
    }
  }

  async updateAvatar(
    userId: number,
    file: Express.Multer.File,
    authenticatedUserId: number,
  ): Promise<UserUpdateAvatarResponse> {
    if (!file) {
      throw new AppException(ErrorCode.FILE_REQUIRED);
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppException(ErrorCode.USER_NOT_EXISTED);
    }

    if (user.id !== authenticatedUserId) {
      throw new AppException(ErrorCode.UNAUTHORIZED);
    }

    // Delete old avatar from MinIO if exists
    if (user.avatar) {
      await this.minioService.deleteFile(user.avatar);
    }

    const { fileUrl } = await this.minioService.uploadFile(
      `avatars/${userId}`,
      file,
    );

    await this.prisma.user.update({
      where: { id: userId },
      data: { avatar: fileUrl },
    });

    return { avatar: fileUrl };
  }
}
