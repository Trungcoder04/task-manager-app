import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards, Req, ParseIntPipe } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectCreationRequestDto } from './dto/project-creation-request.dto';
import { ProjectUpdateRequestDto } from './dto/project-update-request.dto';
import { ProjectMemberRequestDto } from './dto/project-member-request.dto';
// Import Guard xác thực (bạn sửa lại đường dẫn cho đúng với project của team nhé)
import { AuthGuard } from '../auth/auth.guard'; 

@UseGuards(AuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  createProject(@Body() data: ProjectCreationRequestDto, @Req() req : any) {
    return this.projectsService.createProject(data, req.user.id);
  }

  @Get()
  getProjects(@Req() req : any) {
    return this.projectsService.getProjects(req.user.id);
  }

  @Get(':id')
  getProjectById(@Param('id', ParseIntPipe) id: number, @Req() req : any) {
    return this.projectsService.getProjectById(id, req.user.id);
  }

  @Put(':id')
  updateProject(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: ProjectUpdateRequestDto,
    @Req() req : any
  ) {
    return this.projectsService.updateProject(id, data, req.user.id);
  }

  @Delete(':id')
  deleteProject(@Param('id', ParseIntPipe) id: number, @Req() req : any) {
    return this.projectsService.deleteProject(id, req.user.id);
  }

  // --- API QUẢN LÝ THÀNH VIÊN ---

  @Post(':id/members')
  addMember(
    @Param('id', ParseIntPipe) projectId: number,
    @Body() data: ProjectMemberRequestDto,
    @Req() req : any  
  ) {
    return this.projectsService.addMember(projectId, data, req.user.id);
  }

  @Put(':projectId/members/:userId')
  updateMemberRole(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('userId', ParseIntPipe) targetUserId: number,
    @Body() data: ProjectMemberRequestDto,
    @Req() req : any
  ) {
    return this.projectsService.updateMemberRole(projectId, targetUserId, data, req.user.id);
  }

  @Delete(':projectId/members/:userId')
  removeMember(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('userId', ParseIntPipe) targetUserId: number,
    @Req() req : any
  ) {
    return this.projectsService.removeMember(projectId, targetUserId, req.user.id);
  }
}