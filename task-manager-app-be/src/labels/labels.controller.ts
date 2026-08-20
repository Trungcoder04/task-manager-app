import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { LabelsService } from './labels.service';
import { CreateLabelDto } from './dto/create-label.dto';
import { UpdateLabelDto } from './dto/update-label.dto';
import { AuthGuard } from '../auth/auth.guard';

@UseGuards(AuthGuard)
// Đường dẫn sẽ tự động thành: /projects/:projectId/labels
@Controller('projects/:projectId/labels') 
export class LabelsController {
  constructor(private readonly labelsService: LabelsService) {}

  @Post()
  createLabel(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() data: CreateLabelDto
  ) {
    return this.labelsService.createLabel(projectId, data);
  }

  @Get()
  getLabels(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.labelsService.getLabelsByProject(projectId);
  }

  @Put(':labelId')
  updateLabel(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('labelId', ParseIntPipe) labelId: number,
    @Body() data: UpdateLabelDto
  ) {
    return this.labelsService.updateLabel(projectId, labelId, data);
  }

  @Delete(':labelId')
  deleteLabel(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('labelId', ParseIntPipe) labelId: number
  ) {
    return this.labelsService.deleteLabel(projectId, labelId);
  }
}