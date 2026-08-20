import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MinioService } from 'src/minio/minio.service';

@Module({
  providers: [UsersService, MinioService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
