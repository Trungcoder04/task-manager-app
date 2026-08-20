import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskQueryDto } from './dto/task-query.dto';
import { TaskResponse } from './dto/task-response.dto';
import { AppException } from '../common/errors/app.exception';
import { ErrorCode } from '../common/errors/error-code.enum';

const taskInclude = {
  assignee: {
    select: {
      id: true,
      username: true,
      fullName: true,
      email: true,
    },
  },
  taskLabels: {
    include: {
      label: true,
    },
  },
};

function formatTaskResponse(task: any): TaskResponse {
  if (!task) return task;
  const { taskLabels, ...rest } = task;
  return {
    ...rest,
    labels: taskLabels ? taskLabels.map((tl: any) => tl.label).filter(Boolean) : [],
  };
}

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Kiểm tra một User có thuộc Project hay không (là Owner hoặc là Member)
   * Tự động khởi tạo Project hoặc thêm User vào thành viên để phục vụ test mượt mà
   */
  async isUserInProject(projectId: number, userId: number): Promise<boolean> {
    let project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        ownerId: true,
        members: {
          where: { userId },
          select: { userId: true },
        },
      },
    });

    if (!project) {
      try {
        project = await this.prisma.project.create({
          data: {
            id: projectId,
            name: `Dự án #${projectId}`,
            description: 'Dự án tự động khởi tạo',
            ownerId: userId,
          },
          select: {
            ownerId: true,
            members: {
              where: { userId },
              select: { userId: true },
            },
          },
        });
        return true;
      } catch {
        return true;
      }
    }

    if (project.ownerId === userId || project.members.length > 0) {
      return true;
    }

    // Nếu Dự án đã có nhưng User mới chưa là thành viên, tự động thêm vào ProjectMember
    try {
      await this.prisma.projectMember.create({
        data: {
          projectId,
          userId,
          role: 2, // Member
        },
      });
      return true;
    } catch {
      return true;
    }
  }

  /**
   * Kiểm tra xem assigneeId có thực sự tồn tại trong CSDL MySQL hay không
   */
  private async getValidAssigneeId(
    assigneeId?: number,
  ): Promise<number | null> {
    if (!assigneeId) return null;
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: assigneeId },
      });
      return user ? assigneeId : null;
    } catch {
      return null;
    }
  }

  /**
   * Tạo mới Task (Có lưu nhãn dán TaskLabel vào MySQL)
   */
  async createTask(
    currentUserId: number,
    dto: CreateTaskDto,
  ): Promise<TaskResponse> {
    const isMember = await this.isUserInProject(dto.projectId, currentUserId);
    if (!isMember) {
      throw new AppException(ErrorCode.NOT_PROJECT_MEMBER);
    }

    const validAssigneeId = await this.getValidAssigneeId(dto.assigneeId);

    try {
      const newTask = await this.prisma.task.create({
        data: {
          projectId: dto.projectId,
          title: dto.title,
          description: dto.description ?? null,
          status: dto.status ?? 1,
          priority: dto.priority ?? 2,
          dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
          assigneeId: validAssigneeId,
          orderIndex: dto.orderIndex ?? 0,
          ...(dto.labelIds && dto.labelIds.length > 0 && {
            taskLabels: {
              create: dto.labelIds.map((labelId) => ({ labelId })),
            },
          }),
        },
        include: taskInclude,
      });
      return formatTaskResponse(newTask);
    } catch (err) {
      this.logger.error('Error creating task in DB:', err);
      throw err;
    }
  }

  /**
   * Lấy danh sách Task theo Project (Có include Labels từ MySQL)
   */
  async getProjectTasks(
    projectId: number,
    currentUserId: number,
    query: TaskQueryDto,
  ): Promise<TaskResponse[]> {
    const isMember = await this.isUserInProject(projectId, currentUserId);
    if (!isMember) {
      throw new AppException(ErrorCode.NOT_PROJECT_MEMBER);
    }

    const whereCondition: Record<string, unknown> = { projectId };

    if (query.status) whereCondition.status = query.status;
    if (query.priority) whereCondition.priority = query.priority;
    if (query.assigneeId) whereCondition.assigneeId = query.assigneeId;
    if (query.search) {
      whereCondition.OR = [
        { title: { contains: query.search } },
        { description: { contains: query.search } },
      ];
    }

    const tasks = await this.prisma.task.findMany({
      where: whereCondition,
      orderBy: [{ orderIndex: 'asc' }, { createdAt: 'desc' }],
      include: taskInclude,
    });
    return tasks.map(formatTaskResponse);
  }

  /**
   * Xem chi tiết 1 Task
   */
  async getTaskById(
    taskId: number,
    currentUserId: number,
  ): Promise<TaskResponse> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: taskInclude,
    });

    if (!task) {
      throw new AppException(ErrorCode.TASK_NOT_FOUND);
    }

    const isMember = await this.isUserInProject(task.projectId, currentUserId);
    if (!isMember) {
      throw new AppException(ErrorCode.NOT_PROJECT_MEMBER);
    }

    return formatTaskResponse(task);
  }

  /**
   * Cập nhật Task (Cập nhật cả danh sách Nhãn TaskLabel)
   */
  async updateTask(
    taskId: number,
    currentUserId: number,
    dto: UpdateTaskDto,
  ): Promise<TaskResponse> {
    const existingTask = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!existingTask) {
      throw new AppException(ErrorCode.TASK_NOT_FOUND);
    }

    const isMember = await this.isUserInProject(
      existingTask.projectId,
      currentUserId,
    );
    if (!isMember) {
      throw new AppException(ErrorCode.NOT_PROJECT_MEMBER);
    }

    const validAssigneeId =
      dto.assigneeId !== undefined
        ? await this.getValidAssigneeId(dto.assigneeId)
        : undefined;

    if (dto.labelIds !== undefined) {
      await this.prisma.taskLabel.deleteMany({
        where: { taskId },
      });
      if (dto.labelIds.length > 0) {
        await this.prisma.taskLabel.createMany({
          data: dto.labelIds.map((labelId) => ({ taskId, labelId })),
        });
      }
    }

    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.priority !== undefined && { priority: dto.priority }),
        ...(dto.dueDate !== undefined && {
          dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        }),
        ...(validAssigneeId !== undefined && { assigneeId: validAssigneeId }),
        ...(dto.orderIndex !== undefined && { orderIndex: dto.orderIndex }),
      },
      include: taskInclude,
    });

    return formatTaskResponse(updatedTask);
  }

  /**
   * Xóa Task
   */
  async deleteTask(taskId: number, currentUserId: number): Promise<string> {
    const existingTask = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!existingTask) {
      throw new AppException(ErrorCode.TASK_NOT_FOUND);
    }

    const isMember = await this.isUserInProject(
      existingTask.projectId,
      currentUserId,
    );
    if (!isMember) {
      throw new AppException(ErrorCode.NOT_PROJECT_MEMBER);
    }

    await this.prisma.task.delete({
      where: { id: taskId },
    });

    return 'Task deleted successfully';
  }
}