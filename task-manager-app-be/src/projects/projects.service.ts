import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectCreationRequestDto } from './dto/project-creation-request.dto';
import { ProjectUpdateRequestDto } from './dto/project-update-request.dto';
import { ProjectMemberRequestDto } from './dto/project-member-request.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Tạo dự án mới
  async createProject(data: ProjectCreationRequestDto, ownerId: number) {
    return this.prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        ownerId: ownerId,
        members: {
          create: [
            { userId: ownerId, role: 1 } // Gán người tạo làm Owner/Admin
          ],
        },
      },
      include: { owner: true, members: { include: { user: true } } },
    });
  }

  // 2. Lấy danh sách dự án của user (là Owner hoặc Member)
  async getProjects(userId: number) {
    return this.prisma.project.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId: userId } } },
        ],
      },
      include: { owner: true, members: { include: { user: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async canUserManageProject(projectId: number, userId: number): Promise<boolean> {
    const systemUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (systemUser && systemUser.role === 1) return true;

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
    if (!project) return false;
    if (project.ownerId === userId) return true;
    if (project.members.length > 0 && project.members[0].role === 1) return true;
    return false;
  }

  // 3. Xem chi tiết 1 dự án
  async getProjectById(projectId: number, userId: number) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { owner: true, members: { include: { user: true } } },
    });

    if (!project) throw new NotFoundException('Không tìm thấy dự án');

    const systemUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    const isMemberOrOwner = systemUser?.role === 1 || project.ownerId === userId || project.members.some(m => m.userId === userId);
    if (!isMemberOrOwner) {
      throw new ForbiddenException('Bạn không có quyền truy cập dự án này');
    }

    return project;
  }

  // 4. Cập nhật dự án
  async updateProject(projectId: number, data: ProjectUpdateRequestDto, userId: number) {
    const canManage = await this.canUserManageProject(projectId, userId);
    if (!canManage) {
      throw new ForbiddenException('Chỉ Quản trị viên hoặc Chủ dự án mới được phép chỉnh sửa');
    }

    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Không tìm thấy dự án');

    return this.prisma.project.update({
      where: { id: projectId },
      data: {
        name: data.name ?? project.name,
        description: data.description ?? project.description,
      },
      include: { owner: true, members: { include: { user: true } } },
    });
  }

  // 5. Xóa dự án
  async deleteProject(projectId: number, userId: number) {
    const canManage = await this.canUserManageProject(projectId, userId);
    if (!canManage) {
      throw new ForbiddenException('Chỉ Quản trị viên hoặc Chủ dự án mới được phép xóa');
    }

    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Không tìm thấy dự án');

    await this.prisma.projectMember.deleteMany({ where: { projectId } });
    await this.prisma.project.delete({ where: { id: projectId } });
    
    return null;
  }

  // --- QUẢN LÝ THÀNH VIÊN ---

  // 6. Thêm thành viên
  async addMember(projectId: number, data: ProjectMemberRequestDto, currentUserId: number) {
    if (!data.userId) {
      throw new BadRequestException('Vui lòng cung cấp userId của thành viên cần thêm');
    }
    const canManage = await this.canUserManageProject(projectId, currentUserId);
    if (!canManage) {
      throw new ForbiddenException('Chỉ Quản trị viên hoặc Chủ dự án mới được thêm thành viên');
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: data.userId }
    });
    if (!targetUser) {
      throw new NotFoundException('Người dùng này không tồn tại trong hệ thống');
    }
    const project = await this.prisma.project.findUnique({ 
      where: { id: projectId },
      include: { members: true }
    });
    if (!project) throw new NotFoundException('Không tìm thấy dự án');

    const isAlreadyMember = project.members.some(m => m.userId === data.userId);
    if (isAlreadyMember) throw new ForbiddenException('Người dùng đã là thành viên của dự án');

    await this.prisma.projectMember.create({
      data: {
        projectId,
        userId: data.userId,
        role: data.role || 3,
      }
    });

    return this.getProjectById(projectId, currentUserId);
  }

  // 7. Cập nhật quyền thành viên
  async updateMemberRole(projectId: number, targetUserId: number, data: ProjectMemberRequestDto, currentUserId: number) {
    const canManage = await this.canUserManageProject(projectId, currentUserId);
    if (!canManage) {
      throw new ForbiddenException('Chỉ Quản trị viên hoặc Chủ dự án mới được sửa quyền');
    }

    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Không tìm thấy dự án');
    if (project.ownerId === targetUserId && project.ownerId !== currentUserId) {
      throw new ForbiddenException('Không thể sửa quyền của Chủ dự án');
    }

    await this.prisma.projectMember.update({
      where: {
        projectId_userId: { projectId, userId: targetUserId }
      },
      data: { role: data.role }
    });

    return this.getProjectById(projectId, currentUserId);
  }

  // 8. Xóa thành viên
  async removeMember(projectId: number, targetUserId: number, currentUserId: number) {
    const canManage = await this.canUserManageProject(projectId, currentUserId);
    if (!canManage) {
      throw new ForbiddenException('Chỉ Quản trị viên hoặc Chủ dự án mới được xóa thành viên');
    }

    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Không tìm thấy dự án');
    if (project.ownerId === targetUserId) throw new ForbiddenException('Không thể xóa Chủ dự án');

    await this.prisma.projectMember.delete({
      where: {
        projectId_userId: { projectId, userId: targetUserId }
      }
    });

    return this.getProjectById(projectId, currentUserId);
  }
}