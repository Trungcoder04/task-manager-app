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
} from '@nestjs/common';

import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskQueryDto } from './dto/task-query.dto';
import { TaskResponse } from './dto/task-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller()
export class TasksController {
    constructor(private readonly tasksService: TasksService) {}

    // API tao task moi
    @Post('tasks')
    async createTask(
        @CurrentUser('userId') userId: number,
        @Body() dto: CreateTaskDto, ): Promise<TaskResponse> {
            return this.tasksService.createTask(userId, dto);
        }
    
    // Lay danh sach task cua project
    @Get('projects/:projectId/tasks')
    async getProjectTasks(
        @Param('projectId', ParseIntPipe) projectId: number,
        @CurrentUser('userId') userId: number,
        @Query() query: TaskQueryDto, ): Promise<TaskResponse[]> {
            return this.tasksService.getProjectTasks(projectId, userId, query);
        }
    
    // API xem chi tiet 1 task
    @Get('tasks/:id')
    async getTaskById(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser('userId') userId: number, ): Promise<TaskResponse> {
            return this.tasksService.getTaskById(id, userId);
        }

    // API cap nhat task
    @Put('tasks/:id')
    async updateTask(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser('userId') userId: number,
        @Body() dto: UpdateTaskDto, ): Promise<TaskResponse> {
            return this.tasksService.updateTask(id, userId, dto);
        }

    // API xoa task
    @Delete('tasks/:id')
    async deleteTask(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser('userId') userId: number, ): Promise<string> {
            return this.tasksService.deleteTask(id, userId);
        }  

}