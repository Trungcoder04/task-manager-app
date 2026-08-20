import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MinioService } from '../minio/minio.service';
import { AppException } from '../common/errors/app.exception';
import { ErrorCode } from '../common/errors/error-code.enum';
import { TaskAttachmentResponse } from './dto/task-attachment-response.dto';

@Injectable()
export class TaskAttachmentService {
  private readonly logger = new Logger(TaskAttachmentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly minioService: MinioService,
  ) {}

  async uploadAttachment(
    taskId: number,
    file: Express.Multer.File,
    uploaderId: number,
  ): Promise<TaskAttachmentResponse> {
    if (!file) {
      throw new AppException(ErrorCode.FILE_REQUIRED);
    }

    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new AppException(ErrorCode.TASK_NOT_EXISTED);
    }

    const { fileUrl } = await this.minioService.uploadFile(`tasks/${taskId}`, file);

    const attachment = await this.prisma.taskAttachment.create({
      data: {
        taskId,
        uploaderId,
        fileName: file.originalname,
        fileUrl,
      },
      include: {
        uploader: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
      },
    });

    // Create activity record for audit logs
    try {
      await this.prisma.taskActivity.create({
        data: {
          taskId,
          userId: uploaderId,
          action: `Đã đính kèm tệp ${file.originalname}`,
        },
      });
    } catch (err) {
      this.logger.warn(`Failed to create task activity for attachment: ${err}`);
    }

    return attachment;
  }

  async getAttachmentsByTaskId(taskId: number): Promise<TaskAttachmentResponse[]> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new AppException(ErrorCode.TASK_NOT_EXISTED);
    }

    return this.prisma.taskAttachment.findMany({
      where: { taskId },
      orderBy: { uploadedAt: 'desc' },
      include: {
        uploader: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
      },
    });
  }

  async getAttachmentById(id: number): Promise<TaskAttachmentResponse> {
    const attachment = await this.prisma.taskAttachment.findUnique({
      where: { id },
      include: {
        uploader: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
      },
    });

    if (!attachment) {
      throw new AppException(ErrorCode.ATTACHMENT_NOT_FOUND);
    }

    return attachment;
  }

  async deleteAttachment(id: number, userId: number): Promise<{ message: string }> {
    const attachment = await this.prisma.taskAttachment.findUnique({
      where: { id },
    });

    if (!attachment) {
      throw new AppException(ErrorCode.ATTACHMENT_NOT_FOUND);
    }

    await this.minioService.deleteFile(attachment.fileUrl);

    await this.prisma.taskAttachment.delete({
      where: { id },
    });

    try {
      await this.prisma.taskActivity.create({
        data: {
          taskId: attachment.taskId,
          userId,
          action: `Đã xóa tệp đính kèm ${attachment.fileName}`,
        },
      });
    } catch (err) {
      this.logger.warn(`Failed to create task activity for deletion: ${err}`);
    }

    return { message: 'Tệp đính kèm đã được xóa thành công' };
  }

  async getPresignedDownloadUrl(id: number, expirySeconds: number = 3600): Promise<{ downloadUrl: string }> {
    const attachment = await this.prisma.taskAttachment.findUnique({
      where: { id },
    });

    if (!attachment) {
      throw new AppException(ErrorCode.ATTACHMENT_NOT_FOUND);
    }

    const downloadUrl = await this.minioService.getPresignedUrl(attachment.fileUrl, expirySeconds);
    return { downloadUrl };
  }
}
