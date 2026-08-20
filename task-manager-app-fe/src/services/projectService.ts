import { apiClient } from './apiClient';
import { ApiResponse } from '../types/api.types';
import {
  Project,
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectMemberRoleType,
} from '../types/project.types';

class ProjectService {
  async getProjects(): Promise<Project[]> {
    const response = await apiClient.get<unknown, ApiResponse<Project[]>>('/projects');
    if (response && response.result) {
      return response.result;
    }
    return [];
  }

  async getProject(id: number): Promise<Project> {
    const response = await apiClient.get<unknown, ApiResponse<Project>>(`/projects/${id}`);
    if (response && response.result) {
      return response.result;
    }
    throw new Error(response?.message || 'Không thể lấy thông tin dự án');
  }

  async createProject(data: CreateProjectRequest): Promise<Project> {
    const response = await apiClient.post<unknown, ApiResponse<Project>>('/projects', data);
    if (response && response.result) {
      return response.result;
    }
    throw new Error(response?.message || 'Tạo dự án thất bại');
  }

  async updateProject(id: number, data: UpdateProjectRequest): Promise<Project> {
    const response = await apiClient.put<unknown, ApiResponse<Project>>(`/projects/${id}`, data);
    if (response && response.result) {
      return response.result;
    }
    throw new Error(response?.message || 'Cập nhật dự án thất bại');
  }

  async deleteProject(id: number): Promise<void> {
    await apiClient.delete<unknown, ApiResponse<void>>(`/projects/${id}`);
  }

  // --- Quản lý thành viên ---

  async addMember(projectId: number, userId: number, role: ProjectMemberRoleType): Promise<Project> {
    const response = await apiClient.post<unknown, ApiResponse<Project>>(
      `/projects/${projectId}/members`,
      { userId, role }
    );
    if (response && response.result) {
      return response.result;
    }
    throw new Error(response?.message || 'Thêm thành viên thất bại');
  }

  async removeMember(projectId: number, userId: number): Promise<Project> {
    const response = await apiClient.delete<unknown, ApiResponse<Project>>(
      `/projects/${projectId}/members/${userId}`
    );
    if (response && response.result) {
      return response.result;
    }
    throw new Error(response?.message || 'Xóa thành viên thất bại');
  }

  async updateMemberRole(projectId: number, userId: number, role: ProjectMemberRoleType): Promise<Project> {
    const response = await apiClient.put<unknown, ApiResponse<Project>>(
      `/projects/${projectId}/members/${userId}`,
      { role }
    );
    if (response && response.result) {
      return response.result;
    }
    throw new Error(response?.message || 'Cập nhật vai trò thất bại');
  }
}

export const projectService = new ProjectService();