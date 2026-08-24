import {
    Controller,
    Post,
    Get,
    Put,
    Delete,
    Body,
    Param,
    Query,
    ParseIntPipe,
    Patch,
} from '@nestjs/common';

import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskQueryDto } from './dto/task-query.dto';
import { TaskResponse } from './dto/task-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';

@Controller()
export class TasksController {
    constructor(private readonly tasksService: TasksService) { }

    // API tao task moi
    @Post('tasks')
    async createTask(
        @CurrentUser('userId') userId: number,
        @Body() dto: CreateTaskDto,
    ) {
        return this.tasksService.createTask(userId, dto);
    }

    // API cap nhat trang thai task
    @Patch('tasks/:id/status')
    async updateTaskStatus(
        @Param('id', ParseIntPipe) taskId: number,
        @CurrentUser('userId') userId: number,
        @Body() dto: UpdateTaskStatusDto,
    ) {
        return this.tasksService.updateTaskStatus(taskId, userId, dto);
    }

    // Lay danh sach task cua project
    @Get('projects/:projectId/tasks')
    async getProjectTasks(
        @Param('projectId', ParseIntPipe) projectId: number,
        @CurrentUser('userId') userId: number,
        @Query() query: TaskQueryDto,): Promise<TaskResponse[]> {
        return this.tasksService.getProjectTasks(projectId, userId, query);
    }

    // API thong ke Dashboard theo project
    @Get('projects/:projectId/dashboard')
    async getDashboardStats(
        @Param('projectId', ParseIntPipe) projectId: number,
        @CurrentUser('userId') userId: number,
    ) {
        return this.tasksService.getDashboardStats(projectId, userId);
    }

    // API xem chi tiet 1 task
    @Get('tasks/:id')
    async getTaskById(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser('userId') userId: number,): Promise<TaskResponse> {
        return this.tasksService.getTaskById(id, userId);
    }

    // API cap nhat task
    @Put('tasks/:id')
    async updateTask(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser('userId') userId: number,
        @Body() dto: UpdateTaskDto,): Promise<TaskResponse> {
        return this.tasksService.updateTask(id, userId, dto);
    }

    // API lay lich su hoat dong cua 1 task
    @Get('tasks/:id/activities')
    async getTaskActivities(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser('userId') userId: number,
    ) {
        return this.tasksService.getTaskActivities(id, userId);
    }

    // API lay danh sach binh luan cua 1 task
    @Get('tasks/:id/comments')
    async getTaskComments(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser('userId') userId: number,
    ) {
        return this.tasksService.getTaskComments(id, userId);
    }

    // API them binh luan vao 1 task
    @Post('tasks/:id/comments')
    async addTaskComment(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser('userId') userId: number,
        @Body('content') content: string,
    ) {
        return this.tasksService.addTaskComment(id, userId, content);
    }

    // API xoa binh luan
    @Delete('tasks/:id/comments/:commentId')
    async deleteTaskComment(
        @Param('id', ParseIntPipe) id: number,
        @Param('commentId', ParseIntPipe) commentId: number,
        @CurrentUser('userId') userId: number,
    ) {
        return this.tasksService.deleteTaskComment(id, commentId, userId);
    }

    // API xoa task
    @Delete('tasks/:id')
    async deleteTask(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser('userId') userId: number,): Promise<string> {
        return this.tasksService.deleteTask(id, userId);
    }

}