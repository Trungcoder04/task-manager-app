import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UserCreationRequest } from './dto/user-creation-request.dto';
import { UserUpdateRequest } from './dto/user-update-request.dto';
import { UserResponse } from './dto/user-response.dto';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Public()
  @Post()
  async createUser(
    @Body() request: UserCreationRequest,
  ): Promise<UserResponse> {
    return this.usersService.createUser(request);
  }

  @Get()
  async getUsers(): Promise<UserResponse[]> {
    return this.usersService.getUsers();
  }

  @Get('my-info')
  async getMyInfo(
    @CurrentUser('username') username: string,
  ): Promise<UserResponse> {
    return this.usersService.getMyInfo(username);
  }

  @Get(':userId')
  async getUser(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<UserResponse> {
    return this.usersService.getUser(userId);
  }

  @Put(':userId')
  async updateUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() request: UserUpdateRequest,
    @CurrentUser('username') username: string,
  ): Promise<UserResponse> {
    return this.usersService.updateUser(userId, request, username);
  }

  @Delete(':userId')
  async deleteUser(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<string> {
    await this.usersService.deleteUser(userId);
    return 'User has been deleted';
  }
}
