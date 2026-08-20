import { Module } from '@nestjs/common';
import { TaskAttachmentController } from './task-attachment.controller';
import { TaskAttachmentService } from './task-attachment.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MinioService } from 'src/minio/minio.service';

@Module({
  imports: [PrismaModule],
  controllers: [TaskAttachmentController],
  providers: [TaskAttachmentService, MinioService],
  exports: [TaskAttachmentService],
})
export class TaskAttachmentModule {}
