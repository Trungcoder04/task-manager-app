import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLabelDto } from './dto/create-label.dto';
import { UpdateLabelDto } from './dto/update-label.dto';

@Injectable()
export class LabelsService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Lấy danh sách Label của dự án
  async getLabelsByProject(projectId: number) {
    return this.prisma.label.findMany({ 
      where: { projectId },
      orderBy: { id: 'asc' }
    });
  }

  // 2. Tạo Label mới
  async createLabel(projectId: number, data: CreateLabelDto) {
    // Kiểm tra trùng lặp tên nhãn trong cùng 1 dự án
    const existingLabel = await this.prisma.label.findFirst({
      where: { projectId, name: data.name },
    });

    if (existingLabel) {
      throw new BadRequestException('Nhãn này đã tồn tại trong dự án');
    }

    return this.prisma.label.create({
      data: { 
        projectId, 
        name: data.name, 
        colorCode: data.colorCode 
      },
    });
  }

  // 3. Sửa Label
  async updateLabel(projectId: number, labelId: number, data: UpdateLabelDto) {
    const label = await this.prisma.label.findFirst({
      where: { id: labelId, projectId },
    });
    if (!label) throw new NotFoundException('Không tìm thấy nhãn trong dự án này');

    // Nếu có đổi tên, phải check xem tên mới có bị trùng với nhãn khác không
    if (data.name && data.name !== label.name) {
      const existingLabel = await this.prisma.label.findFirst({
        where: { projectId, name: data.name },
      });
      if (existingLabel) throw new BadRequestException('Tên nhãn đã tồn tại trong dự án');
    }

    return this.prisma.label.update({
      where: { id: labelId },
      data: {
        name: data.name ?? label.name,
        colorCode: data.colorCode ?? label.colorCode,
      },
    });
  }

  // 4. Xóa Label
  async deleteLabel(projectId: number, labelId: number) {
    const label = await this.prisma.label.findFirst({
      where: { id: labelId, projectId },
    });
    if (!label) throw new NotFoundException('Không tìm thấy nhãn để xóa');

    // Nếu bạn có bảng trung gian TaskLabels, bạn có thể cần xóa các liên kết trước khi xóa Label
    // await this.prisma.taskLabels.deleteMany({ where: { labelId } });

    await this.prisma.label.delete({ 
      where: { id: labelId } 
    });
    
    return null;
  }
}