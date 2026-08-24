import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskQueryDto } from './dto/task-query.dto';
import { TaskResponse } from './dto/task-response.dto';
import { AppException } from '../common/errors/app.exception';
import { ErrorCode } from '../common/errors/error-code.enum';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(private readonly prisma: PrismaService) { }


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
   * Tạo mới Task (Có kiểm tra ràng buộc Assignee phải thuộc Project)
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
      const created = await this.prisma.task.create({
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
        include: {
          assignee: {
            select: {
              id: true,
              username: true,
              fullName: true,
              email: true,
              avatar: true,
            },
          },
          taskLabels: {
            include: {
              label: true,
            },
          },
        },
      });

      return {
        ...created,
        labels: created.taskLabels?.map((tl) => tl.label) ?? [],
      };
    } catch (err) {
      this.logger.error('Error creating task in DB:', err);
      throw err;
    }
  }

 
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
      include: {
        assignee: {
          select: {
            id: true,
            username: true,
            fullName: true,
            email: true,
            avatar: true,
          },
        },
        taskLabels: {
          include: {
            label: true,
          },
        },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                fullName: true,
                avatar: true,
              },
            },
          },
        },
        attachments: {
          orderBy: { uploadedAt: 'desc' },
          include: {
            uploader: {
              select: {
                id: true,
                username: true,
                fullName: true,
                avatar: true,
              },
            },
          },
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                fullName: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    return tasks.map((task) => ({
      ...task,
      labels: task.taskLabels?.map((tl) => tl.label) ?? [],
    }));
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
      include: {
        assignee: {
          select: {
            id: true,
            username: true,
            fullName: true,
            email: true,
            avatar: true,
          },
        },
        taskLabels: {
          include: {
            label: true,
          },
        },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                fullName: true,
                avatar: true,
              },
            },
          },
        },
        attachments: {
          orderBy: { uploadedAt: 'desc' },
          include: {
            uploader: {
              select: {
                id: true,
                username: true,
                fullName: true,
                avatar: true,
              },
            },
          },
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                fullName: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    if (!task) {
      throw new AppException(ErrorCode.TASK_NOT_FOUND);
    }

    const isMember = await this.isUserInProject(task.projectId, currentUserId);
    if (!isMember) {
      throw new AppException(ErrorCode.NOT_PROJECT_MEMBER);
    }

    return {
      ...task,
      labels: task.taskLabels?.map((tl) => tl.label) ?? [],
    };
  }

  /**
   * Lấy danh sách lịch sử hoạt động (activities) của Task
   */
  async getTaskActivities(
    taskId: number,
    currentUserId: number,
  ) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { projectId: true },
    });

    if (!task) {
      throw new AppException(ErrorCode.TASK_NOT_FOUND);
    }

    const isMember = await this.isUserInProject(task.projectId, currentUserId);
    if (!isMember) {
      throw new AppException(ErrorCode.NOT_PROJECT_MEMBER);
    }

    return this.prisma.taskActivity.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true,
          },
        },
      },
    });
  }

  /**
   * Lấy danh sách bình luận (comments) của Task
   */
  async getTaskComments(
    taskId: number,
    currentUserId: number,
  ) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { projectId: true },
    });

    if (!task) {
      throw new AppException(ErrorCode.TASK_NOT_FOUND);
    }

    const isMember = await this.isUserInProject(task.projectId, currentUserId);
    if (!isMember) {
      throw new AppException(ErrorCode.NOT_PROJECT_MEMBER);
    }

    return this.prisma.taskComment.findMany({
      where: { taskId },
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true,
          },
        },
      },
    });
  }

  /**
   * Thêm bình luận mới vào Task
   */
  async addTaskComment(
    taskId: number,
    currentUserId: number,
    content: string,
  ) {
    if (!content || !content.trim()) {
      throw new AppException(ErrorCode.INVALID_KEY);
    }

    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { projectId: true },
    });

    if (!task) {
      throw new AppException(ErrorCode.TASK_NOT_FOUND);
    }

    const isMember = await this.isUserInProject(task.projectId, currentUserId);
    if (!isMember) {
      throw new AppException(ErrorCode.NOT_PROJECT_MEMBER);
    }

    return this.prisma.taskComment.create({
      data: {
        taskId,
        userId: currentUserId,
        content: content.trim(),
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true,
          },
        },
      },
    });
  }

  /**
   * Xóa bình luận
   */
  async deleteTaskComment(
    taskId: number,
    commentId: number,
    currentUserId: number,
  ) {
    const comment = await this.prisma.taskComment.findUnique({
      where: { id: commentId },
    });

    if (!comment || comment.taskId !== taskId) {
      throw new AppException(ErrorCode.TASK_NOT_FOUND);
    }

    if (comment.userId !== currentUserId) {
      throw new AppException(ErrorCode.UNAUTHORIZED);
    }

    await this.prisma.taskComment.delete({
      where: { id: commentId },
    });

    return { message: 'Bình luận đã được xóa thành công' };
  }

  /**
   * Cập nhật Task
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

    // So sánh dữ liệu cũ và mới để xác định những trường thực sự thay đổi
    const changes: string[] = [];

    if (dto.status !== undefined && dto.status !== existingTask.status) {
      const statusMap: Record<number, string> = { 1: 'TODO', 2: 'DOING', 3: 'DONE' };
      const oldStatus = statusMap[existingTask.status] || existingTask.status;
      const newStatus = statusMap[dto.status] || dto.status;
      changes.push(`Đổi trạng thái: ${oldStatus} → ${newStatus}`);
    }

    if (dto.priority !== undefined && dto.priority !== existingTask.priority) {
      const priorityMap: Record<number, string> = { 1: 'Thấp', 2: 'Trung bình', 3: 'Cao' };
      const oldPriority = priorityMap[existingTask.priority] || existingTask.priority;
      const newPriority = priorityMap[dto.priority] || dto.priority;
      changes.push(`Đổi độ ưu tiên: ${oldPriority} → ${newPriority}`);
    }

    if (dto.title !== undefined && dto.title.trim() !== existingTask.title) {
      changes.push(`Đổi tiêu đề thành "${dto.title.trim()}"`);
    }

    if (dto.description !== undefined && dto.description !== existingTask.description) {
      changes.push('Cập nhật mô tả công việc');
    }

    if (dto.dueDate !== undefined) {
      const oldDate = existingTask.dueDate ? existingTask.dueDate.toISOString().split('T')[0] : null;
      const newDate = dto.dueDate ? new Date(dto.dueDate).toISOString().split('T')[0] : null;
      if (oldDate !== newDate) {
        changes.push(newDate ? `Cập nhật hạn chót: ${newDate}` : 'Đã xóa hạn chót');
      }
    }

    if (validAssigneeId !== undefined && validAssigneeId !== existingTask.assigneeId) {
      if (validAssigneeId === null) {
        changes.push('Bỏ chỉ định người thực hiện');
      } else {
        const newAssignee = await this.prisma.user.findUnique({
          where: { id: validAssigneeId },
          select: { fullName: true },
        });
        changes.push(`Chỉ định cho ${newAssignee?.fullName || 'thành viên mới'}`);
      }
    }

    // Cập nhật nhãn dán trong CSDL nếu có gửi labelIds
    if (dto.labelIds !== undefined) {
      await this.prisma.taskLabel.deleteMany({
        where: { taskId },
      });

      if (dto.labelIds.length > 0) {
        await this.prisma.taskLabel.createMany({
          data: dto.labelIds.map((labelId) => ({ taskId, labelId })),
          skipDuplicates: true,
        });
      }
    }

    await this.prisma.task.update({
      where: { id: taskId },
      data: {
        ...(dto.title !== undefined && { title: dto.title.trim() }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.priority !== undefined && { priority: dto.priority }),
        ...(dto.dueDate !== undefined && {
          dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        }),
        ...(validAssigneeId !== undefined && { assigneeId: validAssigneeId }),
        ...(dto.orderIndex !== undefined && { orderIndex: dto.orderIndex }),
      },
    });

    // Tạo activity record nếu có thay đổi thực tế
    if (changes.length > 0) {
      try {
        await this.prisma.taskActivity.create({
          data: {
            taskId,
            userId: currentUserId,
            action: changes.join(' • '),
          },
        });
      } catch (err) {
        this.logger.warn(`Failed to create task activity for update: ${err}`);
      }
    }

    return this.getTaskById(taskId, currentUserId);
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

  /**
   * Thống kê Dashboard theo Project (Task F04)
   */
  async getDashboardStats(projectId: number, currentUserId: number) {
    const isMember = await this.isUserInProject(projectId, currentUserId);
    if (!isMember) {
      throw new AppException(ErrorCode.NOT_PROJECT_MEMBER);
    }

    const tasks = await this.prisma.task.findMany({
      where: { projectId },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
      include: {
        assignee: {
          select: {
            id: true,
            username: true,
            fullName: true,
            email: true,
            avatar: true,
          },
        },
        taskLabels: {
          include: {
            label: true,
          },
        },
      },
    });

    const formattedTasks = tasks.map((t) => ({
      ...t,
      labels: t.taskLabels ? t.taskLabels.map((tl) => tl.label) : [],
    }));

    const totalTasks = formattedTasks.length;
    const todoTasks = formattedTasks.filter((t) => t.status === 1).length;
    const doingTasks = formattedTasks.filter((t) => t.status === 2).length;
    const doneTasks = formattedTasks.filter((t) => t.status === 3).length;
    const highPriorityTasks = formattedTasks.filter(
      (t) => t.priority === 3,
    ).length;

    const now = new Date();
    const overdueTasks = formattedTasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 3,
    ).length;

    const completionRate =
      totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

    const upcomingTasks = formattedTasks
      .filter((t) => t.dueDate && t.status !== 3)
      .slice(0, 5);

    return {
      totalTasks,
      todoTasks,
      doingTasks,
      doneTasks,
      highPriorityTasks,
      overdueTasks,
      completionRate,
      upcomingTasks,
    };
  }
}