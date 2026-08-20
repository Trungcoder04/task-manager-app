import { Module } from '@nestjs/common';
import { TaskAttachmentController } from './task-attachment.controller';
import { TaskAttachmentService } from './task-attachment.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TaskAttachmentController],
  providers: [TaskAttachmentService],
  exports: [TaskAttachmentService],
})
export class TaskAttachmentModule {}
