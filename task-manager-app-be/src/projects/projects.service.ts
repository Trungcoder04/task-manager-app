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

  // 3. Xem chi tiết 1 dự án
  async getProjectById(projectId: number, userId: number) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { owner: true, members: { include: { user: true } } },
    });

    if (!project) throw new NotFoundException('Không tìm thấy dự án');

    const isMemberOrOwner = project.ownerId === userId || project.members.some(m => m.userId === userId);
    if (!isMemberOrOwner) {
      throw new ForbiddenException('Bạn không có quyền truy cập dự án này');
    }

    return project;
  }

  // 4. Cập nhật dự án (Chỉ Owner)
  async updateProject(projectId: number, data: ProjectUpdateRequestDto, userId: number) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Không tìm thấy dự án');
    
    if (project.ownerId !== userId) {
      throw new ForbiddenException('Chỉ Chủ dự án mới được phép chỉnh sửa');
    }

    return this.prisma.project.update({
      where: { id: projectId },
      data: {
        name: data.name ?? project.name,
        description: data.description ?? project.description,
      },
      include: { owner: true, members: { include: { user: true } } },
    });
  }

  // 5. Xóa dự án (Chỉ Owner)
  async deleteProject(projectId: number, userId: number) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Không tìm thấy dự án');
    
    if (project.ownerId !== userId) {
      throw new ForbiddenException('Chỉ Chủ dự án mới được phép xóa');
    }

    // Prisma: Nếu bạn chưa set onDelete: Cascade trong schema, bạn phải xóa members trước
    await this.prisma.projectMember.deleteMany({ where: { projectId } });
    await this.prisma.project.delete({ where: { id: projectId } });
    
    return null; // Trả về null cho API delete
  }

  // --- QUẢN LÝ THÀNH VIÊN ---

  // 6. Thêm thành viên (Chỉ Owner)
  async addMember(projectId: number, data: ProjectMemberRequestDto, ownerId: number) {
    if (!data.userId) {
      throw new BadRequestException('Vui lòng cung cấp userId của thành viên cần thêm');
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
    if (project.ownerId !== ownerId) throw new ForbiddenException('Chỉ Chủ dự án mới được thêm thành viên');

    const isAlreadyMember = project.members.some(m => m.userId === data.userId);
    if (isAlreadyMember) throw new ForbiddenException('Người dùng đã là thành viên của dự án');

    await this.prisma.projectMember.create({
      data: {
        projectId,
        userId: data.userId,
        role: data.role,
      }
    });

    return this.getProjectById(projectId, ownerId); // Trả về project mới nhất
  }

  // 7. Cập nhật quyền thành viên (Chỉ Owner)
  async updateMemberRole(projectId: number, targetUserId: number, data: ProjectMemberRequestDto, ownerId: number) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Không tìm thấy dự án');
    if (project.ownerId !== ownerId) throw new ForbiddenException('Chỉ Chủ dự án mới được sửa quyền');
    if (project.ownerId === targetUserId) throw new ForbiddenException('Không thể tự sửa quyền của Chủ dự án');

    await this.prisma.projectMember.update({
      where: {
        projectId_userId: { projectId, userId: targetUserId }
      },
      data: { role: data.role }
    });

    return this.getProjectById(projectId, ownerId);
  }

  // 8. Xóa thành viên (Chỉ Owner)
  async removeMember(projectId: number, targetUserId: number, ownerId: number) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Không tìm thấy dự án');
    if (project.ownerId !== ownerId) throw new ForbiddenException('Chỉ Chủ dự án mới được xóa thành viên');
    if (project.ownerId === targetUserId) throw new ForbiddenException('Không thể xóa Chủ dự án');

    await this.prisma.projectMember.delete({
      where: {
        projectId_userId: { projectId, userId: targetUserId }
      }
    });

    return this.getProjectById(projectId, ownerId);
  }
}