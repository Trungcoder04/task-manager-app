import {
    Controller,
    Post,
    Get,
    Delete,
    Param,
    UploadedFile,
    UseInterceptors,
    ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TaskAttachmentService } from './task-attachment.service';
import { TaskAttachmentResponse } from './dto/task-attachment-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TaskActivity } from '../common/task-activity';

@Controller('task-attachments')
export class TaskAttachmentController {
    constructor(
        private readonly taskAttachmentService: TaskAttachmentService,
    ) { }

    @Post('upload/:taskId')
    @UseInterceptors(FileInterceptor('file'))
    @TaskActivity({
        action: (req) => `Tải lên tệp đính kèm: ${req.file?.originalname || 'tệp mới'}`,
        taskId: (req) => Number(req.params.taskId),
    })
    async uploadAttachment(
        @Param('taskId', ParseIntPipe) taskId: number,
        @UploadedFile() file: Express.Multer.File,
        @CurrentUser('id') uploaderId: number,
    ): Promise<TaskAttachmentResponse> {
        return this.taskAttachmentService.uploadAttachment(
            taskId,
            file,
            uploaderId,
        );
    }

    @Get('task/:taskId')
    async getAttachmentsByTaskId(
        @Param('taskId', ParseIntPipe) taskId: number,
    ): Promise<TaskAttachmentResponse[]> {
        return this.taskAttachmentService.getAttachmentsByTaskId(taskId);
    }

    @Get(':id')
    async getAttachmentById(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<TaskAttachmentResponse> {
        return this.taskAttachmentService.getAttachmentById(id);
    }

    @TaskActivity({
        action: (req) => `Xóa tệp đính kèm ${req.file?.originalname}`,
        taskId: (req) => Number(req.params.taskId),
    })
    @Delete(':id')
    async deleteAttachment(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser('id') userId: number,
    ): Promise<{ message: string }> {
        return this.taskAttachmentService.deleteAttachment(id, userId);
    }

    @Get(':id/presigned-url')
    async getPresignedUrl(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<{ downloadUrl: string }> {
        return this.taskAttachmentService.getPresignedDownloadUrl(id);
    }
}
