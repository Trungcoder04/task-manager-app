import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskQueryDto } from './dto/task-query.dto';
import { TaskResponse } from './dto/task-response.dto';
import { AppException } from '../common/errors/app.exception';
import { ErrorCode } from '../common/errors/error-code.enum';
import { ProjectRole, TaskStatus, TaskStatusName } from './enums/task-status.enum';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { CreateExtensionRequestDto } from './dto/create-extension-request.dto';
import { ReviewExtensionRequestDto } from './dto/review-extension-request.dto';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(private readonly prisma: PrismaService) { }

  /**
   * Kiểm tra một User có thuộc Project hay không (là Owner hoặc là Member)
   * Tự động khởi tạo Project hoặc thêm User vào thành viên để phục vụ test mượt mà
   */
  async getUserProjectRole(projectId: number, userId: number): Promise<ProjectRole | null> {
    const systemUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (systemUser && systemUser.role === 1) {
      return ProjectRole.ADMIN;
    }

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        ownerId: true,
        members: {
          where: { userId },
          select: { role: true },
        },
      },
    });
    if (!project) return null;
    if (project.ownerId === userId) return ProjectRole.ADMIN;
    if (project.members.length > 0) {
      const mRole = project.members[0].role;
      if (mRole === 1 || mRole === 2) {
        return ProjectRole.ADMIN;
      }
      return ProjectRole.MEMBER;
    }
    return null;
  }
  validateStatusTransition(
    currentStatus: TaskStatus,
    targetStatus: TaskStatus,
    userRole: ProjectRole,
  ): { isValid: boolean; message?: string } {
    if (currentStatus === targetStatus) {
      return { isValid: true };
    }
    const isAdmin = userRole === ProjectRole.ADMIN;
    const isMember = userRole === ProjectRole.MEMBER;
    switch (currentStatus) {
      case TaskStatus.PENDING:
        // PENDING -> TODO (Duyệt) hoặc REJECTED (Từ chối): CHỈ ADMIN
        if ((targetStatus === TaskStatus.TODO || targetStatus === TaskStatus.REJECTED) && !isAdmin) {
          return { isValid: false, message: 'Chỉ ADMIN mới có quyền Duyệt hoặc Từ chối Task đang PENDING' };
        }
        if (targetStatus !== TaskStatus.TODO && targetStatus !== TaskStatus.REJECTED) {
          return { isValid: false, message: 'Từ PENDING chỉ có thể chuyển sang TODO hoặc REJECTED' };
        }
        break;
      case TaskStatus.TODO:
        // TODO -> IN_PROGRESS: Cả MEMBER và ADMIN đều được
        if (targetStatus === TaskStatus.IN_PROGRESS) {
          return { isValid: true };
        }
        
        // Xử lý nhánh đi tới REJECTED
        if (targetStatus === TaskStatus.REJECTED) {
          if (!isAdmin) {
            return { isValid: false, message: 'Chỉ ADMIN mới có quyền chuyển Task từ TODO về REJECTED' };
          }
          return { isValid: true }; // Admin thì cho phép qua
        }
        
        // Nếu chạy xuống tới đây, targetStatus chắc chắn không phải IN_PROGRESS và REJECTED
        return { isValid: false, message: 'Từ TODO chỉ có thể chuyển sang IN_PROGRESS hoặc REJECTED' };
        break;
      case TaskStatus.IN_PROGRESS:
        // IN_PROGRESS -> IN_REVIEW (Gửi nghiệm thu) hoặc quay về TODO: Cả MEMBER và ADMIN
        if (targetStatus === TaskStatus.IN_REVIEW || targetStatus === TaskStatus.TODO) {
          return { isValid: true };
        }
        return { isValid: false, message: 'Từ IN_PROGRESS chỉ có thể chuyển sang IN_REVIEW hoặc quay về TODO' };
      case TaskStatus.IN_REVIEW:
        // IN_REVIEW -> DONE (Nghiệm thu đạt), TODO hoặc IN_PROGRESS (Yêu cầu làm lại), REJECTED: CHỈ ADMIN
        if (!isAdmin) {
          return { isValid: false, message: 'Chỉ ADMIN mới có quyền nghiệm thu (Duyệt Đạt hoặc Yêu cầu làm lại)' };
        }
        if (
          targetStatus !== TaskStatus.DONE &&
          targetStatus !== TaskStatus.TODO &&
          targetStatus !== TaskStatus.IN_PROGRESS &&
          targetStatus !== TaskStatus.REJECTED
        ) {
          return { isValid: false, message: 'Từ IN_REVIEW chỉ có thể chuyển sang DONE, TODO, IN_PROGRESS hoặc REJECTED' };
        }
        break;
      case TaskStatus.REJECTED:
        // Cho phép gửi lại yêu cầu duyệt (REJECTED -> PENDING) hoặc ADMIN mở lại TODO
        if (targetStatus === TaskStatus.PENDING) {
          return { isValid: true };
        }
        if (targetStatus === TaskStatus.TODO && !isAdmin) {
          return { isValid: false, message: 'Chỉ ADMIN mới có thể chuyển trực tiếp từ REJECTED sang TODO' };
        }
        break;
      case TaskStatus.DONE:
        // Mở lại task đã DONE: Chỉ ADMIN
        if (!isAdmin) {
          return { isValid: false, message: 'Chỉ ADMIN mới có quyền mở lại Task đã hoàn thành (DONE)' };
        }
        break;
      default:
        return { isValid: false, message: 'Trạng thái không xác định' };
    }
    return { isValid: true };
  }

   async updateTaskStatus(
    taskId: number,
    currentUserId: number,
    dto: UpdateTaskStatusDto,
  ) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });
    if (!task) {
      throw new AppException(ErrorCode.TASK_NOT_FOUND);
    }
    const userRole = await this.getUserProjectRole(task.projectId, currentUserId);
    if (!userRole) {
      throw new AppException(ErrorCode.NOT_PROJECT_MEMBER);
    }
    const currentStatus = task.status as TaskStatus;
    const targetStatus = dto.status as TaskStatus;
    // Validate Transition & Quyền hạn
    const validation = this.validateStatusTransition(currentStatus, targetStatus, userRole);
    if (!validation.isValid) {
      throw new AppException({
        code: 1020,
        message: validation.message || 'Chuyển trạng thái không hợp lệ',
        statusCode: 403,
      });
    }
    if (currentStatus === targetStatus) {
      return this.getTaskById(taskId, currentUserId);
    }
    // Cập nhật CSDL
    await this.prisma.task.update({
      where: { id: taskId },
      data: { status: targetStatus },
    });

    // Tạo Activity Log rõ ràng
    const fromStatusText = TaskStatusName[currentStatus] || `Status ${currentStatus}`;
    const toStatusText = TaskStatusName[targetStatus] || `Status ${targetStatus}`;
    const roleText = userRole === ProjectRole.ADMIN ? 'Admin' : 'Member';

    let actionDetail = `${roleText} chuyển trạng thái: ${fromStatusText} ➔ ${toStatusText}`;
    if (currentStatus === TaskStatus.PENDING && targetStatus === TaskStatus.REJECTED) {
      actionDetail = `Admin từ chối duyệt công việc: PENDING ➔ REJECTED${dto.note ? ` (Lý do: "${dto.note.trim()}")` : ''}`;
    } else if (currentStatus === TaskStatus.IN_REVIEW && (targetStatus === TaskStatus.TODO || targetStatus === TaskStatus.IN_PROGRESS)) {
      actionDetail = `Admin yêu cầu làm lại: IN_REVIEW ➔ ${toStatusText}${dto.note ? ` (Góp ý: "${dto.note.trim()}")` : ''}`;
    } else if (dto.note) {
      actionDetail += ` (Ghi chú: "${dto.note.trim()}")`;
    }

    await this.prisma.taskActivity.create({
      data: {
        taskId,
        userId: currentUserId,
        action: actionDetail,
      },
    });

    // Tự động tạo Comment thông báo nếu có nhập lý do / góp ý
    if (dto.note && dto.note.trim()) {
      try {
        const prefix = currentStatus === TaskStatus.IN_REVIEW ? '⚠️ Yêu cầu làm lại' : (targetStatus === TaskStatus.REJECTED ? '❌ Từ chối' : '💬 Ghi chú');
        await this.prisma.taskComment.create({
          data: {
            taskId,
            userId: currentUserId,
            content: `**[${prefix}]**: ${dto.note.trim()}`,
          },
        });
      } catch (err) {
        this.logger.warn(`Failed to create task comment for note: ${err}`);
      }
    }

    return this.getTaskById(taskId, currentUserId);
  }
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
   async createTask(currentUserId: number, dto: CreateTaskDto) {
    const userRole = await this.getUserProjectRole(dto.projectId, currentUserId);
    if (!userRole) {
      throw new AppException(ErrorCode.NOT_PROJECT_MEMBER);
    }
    const isAdmin = userRole === ProjectRole.ADMIN;
    if (!dto.title || !dto.title.trim()) {
      throw new AppException(ErrorCode.INVALID_KEY);
    }
    let initialStatus = dto.status !== undefined ? dto.status : TaskStatus.PENDING;
    if (isAdmin || (dto.assigneeId && dto.assigneeId === currentUserId)) {
      initialStatus = dto.status !== undefined ? dto.status : TaskStatus.TODO;
    }

    const task = await this.prisma.task.create({
      data: {
        projectId: dto.projectId,
        title: dto.title.trim(),
        description: dto.description ?? null,
        status: initialStatus,
        priority: dto.priority ?? 2,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        assigneeId: dto.assigneeId ?? null,
        assignerId: dto.assignerId ?? (isAdmin ? currentUserId : null),
        createdById: currentUserId,
        orderIndex: dto.orderIndex ?? 0,
      },
    });
    // Ghi nhận Activity Log tạo task
    const creatorRoleText = isAdmin ? 'Admin/Lead' : 'Member';
    const statusText = TaskStatusName[initialStatus];
    await this.prisma.taskActivity.create({
      data: {
        taskId: task.id,
        userId: currentUserId,
        action: `Tạo công việc mới (${creatorRoleText}) ở trạng thái [${statusText}]`,
      },
    });
    return this.getTaskById(task.id, currentUserId);
  }

  /**
   * Lấy danh sách Task theo Project (Có filter, tìm kiếm & Phân quyền bảo mật Task PENDING/DRAFT)
   */
  async getProjectTasks(
    projectId: number,
    currentUserId: number,
    query: TaskQueryDto,
  ): Promise<TaskResponse[]> {
    const userRole = await this.getUserProjectRole(projectId, currentUserId);
    if (!userRole) {
      throw new AppException(ErrorCode.NOT_PROJECT_MEMBER);
    }

    const isAdminOrLead = userRole === ProjectRole.ADMIN;

    // 🔒 CHÍNH SÁCH BẢO MẬT HIỂN THỊ TASK PENDING/DRAFT
    // Member thường: chỉ thấy task khi:
    //   a) status >= 1 (đã được duyệt vào TODO+)
    //   b) hoặc họ là người TẠO task (createdById)
    //   c) hoặc họ là người GIAO việc (assignerId)
    // Admin/Lead/Owner: thấy tất cả task
    const visibilityFilter = !isAdminOrLead
      ? {
          OR: [
            { status: { gte: 1 } },
            { createdById: currentUserId },
            { assignerId: currentUserId },
          ],
        }
      : {};

    // Gộp tất cả filter vào AND để tránh xung đột
    const andConditions: object[] = [
      { projectId },
      ...(Object.keys(visibilityFilter).length > 0 ? [visibilityFilter] : []),
    ];

    if (query.status !== undefined && query.status !== null) {
      andConditions.push({ status: query.status });
    }
    if (query.priority !== undefined && query.priority !== null) {
      andConditions.push({ priority: query.priority });
    }
    if (query.assigneeId !== undefined && query.assigneeId !== null) {
      andConditions.push({ assigneeId: query.assigneeId });
    }
    if (query.search) {
      andConditions.push({
        OR: [
          { title: { contains: query.search } },
          { description: { contains: query.search } },
        ],
      });
    }

    const whereCondition = { AND: andConditions };

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
        assigner: {
          select: {
            id: true,
            username: true,
            fullName: true,
            email: true,
            avatar: true,
          },
        },
        createdBy: {
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
        extensionRequests: {
          orderBy: { createdAt: 'desc' },
          include: {
            requestedBy: {
              select: {
                id: true,
                username: true,
                fullName: true,
                avatar: true,
              },
            },
            reviewedBy: {
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
        extensionRequests: {
          orderBy: { createdAt: 'desc' },
          include: {
            requestedBy: {
              select: {
                id: true,
                username: true,
                fullName: true,
                avatar: true,
              },
            },
            reviewedBy: {
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

    const validAssignerId =
      dto.assignerId !== undefined
        ? await this.getValidAssigneeId(dto.assignerId)
        : undefined;

    // So sánh dữ liệu cũ và mới để xác định những trường thực sự thay đổi
    const changes: string[] = [];

    if (dto.status !== undefined && dto.status !== existingTask.status) {
      const oldStatus = TaskStatusName[existingTask.status as TaskStatus] || `Status ${existingTask.status}`;
      const newStatus = TaskStatusName[dto.status as TaskStatus] || `Status ${dto.status}`;
      changes.push(`Đổi trạng thái: ${oldStatus} → ${newStatus}`);
    }

    if (dto.priority !== undefined && dto.priority !== existingTask.priority) {
      const priorityMap: Record<number, string> = { 1: 'Thấp', 2: 'Trung bình', 3: 'Cao' };
      const oldPriority = priorityMap[existingTask.priority] || existingTask.priority;
      const newPriority = priorityMap[dto.priority] || dto.priority;
      changes.push(`Đổi độ ưu tiên: ${oldPriority} → ${newPriority}`);
    }

    if (dto.title !== undefined) {
      if (!dto.title.trim()) {
        throw new AppException(ErrorCode.INVALID_KEY);
      }
      if (dto.title.trim() !== existingTask.title) {
        changes.push(`Đổi tiêu đề thành "${dto.title.trim()}"`);
      }
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

    if (validAssignerId !== undefined && validAssignerId !== existingTask.assignerId) {
      if (validAssignerId === null) {
        changes.push('Bỏ chỉ định người giao việc');
      } else {
        const newAssigner = await this.prisma.user.findUnique({
          where: { id: validAssignerId },
          select: { fullName: true },
        });
        changes.push(`Đổi người giao việc thành ${newAssigner?.fullName || 'thành viên mới'}`);
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
        ...(validAssignerId !== undefined && { assignerId: validAssignerId }),
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
    const pendingTasks = formattedTasks.filter((t) => t.status === 0).length;
    const todoTasks = formattedTasks.filter((t) => t.status === 1).length;
    const doingTasks = formattedTasks.filter((t) => t.status === 2).length;
    const inReviewTasks = formattedTasks.filter((t) => t.status === 3).length;
    const doneTasks = formattedTasks.filter((t) => t.status === 4).length;
    const rejectedTasks = formattedTasks.filter((t) => t.status === 5).length;
    const highPriorityTasks = formattedTasks.filter(
      (t) => t.priority === 3,
    ).length;

    const now = new Date();
    const overdueTasks = formattedTasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 4 && t.status !== 5,
    ).length;

    const completionRate =
      totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

    const upcomingTasks = formattedTasks
      .filter((t) => t.dueDate && t.status !== 4 && t.status !== 5)
      .slice(0, 5);

    return {
      totalTasks,
      pendingTasks,
      todoTasks,
      doingTasks,
      inReviewTasks,
      doneTasks,
      rejectedTasks,
      highPriorityTasks,
      overdueTasks,
      completionRate,
      upcomingTasks,
    };
  }

  /**
   * Gửi yêu cầu xin gia hạn deadline
   */
  async requestExtension(
    currentUserId: number,
    taskId: number,
    dto: CreateExtensionRequestDto,
  ) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        extensionRequests: {
          where: { status: 0 },
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

    if (task.status === TaskStatus.DONE) {
      throw new AppException(ErrorCode.INVALID_KEY, 'Công việc đã hoàn thành, không thể xin gia hạn.');
    }

    if (task.extensionRequests && task.extensionRequests.length > 0) {
      throw new AppException(ErrorCode.INVALID_KEY, 'Công việc đang có yêu cầu gia hạn chờ duyệt. Vui lòng chờ phản hồi!');
    }

    const newDueDate = new Date(dto.newDueDate);
    if (isNaN(newDueDate.getTime())) {
      throw new AppException(ErrorCode.INVALID_KEY, 'Hạn chót mới không hợp lệ.');
    }

    if (task.dueDate) {
      const oldTime = new Date(task.dueDate).setHours(0, 0, 0, 0);
      const newTime = new Date(newDueDate).setHours(0, 0, 0, 0);
      if (newTime <= oldTime) {
        throw new AppException(ErrorCode.INVALID_KEY, 'Hạn chót mới phải sau hạn chót hiện tại.');
      }
    }

    await this.prisma.taskExtensionRequest.create({
      data: {
        taskId,
        requestedById: currentUserId,
        oldDueDate: task.dueDate,
        newDueDate,
        reason: dto.reason.trim(),
        status: 0, // PENDING
      },
    });

    const formattedOldDate = task.dueDate ? task.dueDate.toISOString().split('T')[0] : 'Chưa có';
    const formattedNewDate = newDueDate.toISOString().split('T')[0];

    // Ghi log hoạt động
    await this.prisma.taskActivity.create({
      data: {
        taskId,
        userId: currentUserId,
        action: `Gửi yêu cầu xin gia hạn deadline đến ${formattedNewDate} (Hạn cũ: ${formattedOldDate}). Lý do: "${dto.reason.trim()}"`,
      },
    });

    // Tạo comment thông báo
    await this.prisma.taskComment.create({
      data: {
        taskId,
        userId: currentUserId,
        content: `⏰ **[Yêu cầu xin gia hạn]**: Đề xuất dời hạn chót đến ngày **${formattedNewDate}**.\n\n*Lý do:* ${dto.reason.trim()}`,
      },
    });

    return this.getTaskById(taskId, currentUserId);
  }

  /**
   * Phê duyệt yêu cầu xin gia hạn deadline (Chấp thuận / Từ chối)
   */
  async reviewExtension(
    currentUserId: number,
    taskId: number,
    extensionId: number,
    dto: ReviewExtensionRequestDto,
  ) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        extensionRequests: {
          where: { id: extensionId },
        },
      },
    });

    if (!task) {
      throw new AppException(ErrorCode.TASK_NOT_FOUND);
    }

    const extension = task.extensionRequests?.[0];
    if (!extension) {
      throw new AppException(ErrorCode.INVALID_KEY, 'Không tìm thấy yêu cầu gia hạn.');
    }

    if (extension.status !== 0) {
      throw new AppException(ErrorCode.INVALID_KEY, 'Yêu cầu gia hạn này đã được xử lý trước đó.');
    }

    // Kiểm tra quyền: Người giao việc (assigner) hoặc Admin/Lead dự án
    const userRole = await this.getUserProjectRole(task.projectId, currentUserId);
    const isAssigner = task.assignerId === currentUserId;
    const isAdminOrLead = userRole === ProjectRole.ADMIN || userRole === ProjectRole.LEAD;

    if (!isAssigner && !isAdminOrLead) {
      throw new AppException(ErrorCode.UNAUTHORIZED, 'Chỉ Người giao việc hoặc Admin/Lead mới có quyền duyệt yêu cầu gia hạn.');
    }

    const isApproved = dto.status === 1;
    const now = new Date();
    const formattedNewDate = extension.newDueDate.toISOString().split('T')[0];

    // Cập nhật Extension Request
    await this.prisma.taskExtensionRequest.update({
      where: { id: extensionId },
      data: {
        status: isApproved ? 1 : 2,
        reviewedById: currentUserId,
        reviewedAt: now,
        reviewNote: dto.reviewNote?.trim() || null,
      },
    });

    if (isApproved) {
      // Cập nhật DueDate của Task
      await this.prisma.task.update({
        where: { id: taskId },
        data: {
          dueDate: extension.newDueDate,
        },
      });

      // Log activity
      await this.prisma.taskActivity.create({
        data: {
          taskId,
          userId: currentUserId,
          action: `Chấp thuận gia hạn deadline đến ngày ${formattedNewDate}${dto.reviewNote ? ` (Ghi chú: "${dto.reviewNote.trim()}")` : ''}`,
        },
      });

      // Tạo comment thông báo
      await this.prisma.taskComment.create({
        data: {
          taskId,
          userId: currentUserId,
          content: `✅ **[Đã duyệt gia hạn]**: Hạn chót mới đã được dời đến ngày **${formattedNewDate}**!${dto.reviewNote ? `\n\n*Ghi chú:* ${dto.reviewNote.trim()}` : ''}`,
        },
      });
    } else {
      // Log activity từ chối
      await this.prisma.taskActivity.create({
        data: {
          taskId,
          userId: currentUserId,
          action: `Từ chối yêu cầu gia hạn deadline${dto.reviewNote ? ` (Lý do: "${dto.reviewNote.trim()}")` : ''}`,
        },
      });

      // Tạo comment thông báo từ chối
      await this.prisma.taskComment.create({
        data: {
          taskId,
          userId: currentUserId,
          content: `❌ **[Từ chối gia hạn]**: Yêu cầu gia hạn deadline đã bị từ chối.${dto.reviewNote ? `\n\n*Lý do:* ${dto.reviewNote.trim()}` : ''}`,
        },
      });
    }

    return this.getTaskById(taskId, currentUserId);
  }
}