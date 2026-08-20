import { apiClient } from './apiClient';
import { ApiResponse } from '../types/api.types';
import { Label, CreateLabelRequest } from '../types/label.types';

// Nếu bạn có UpdateLabelRequest thì import vào, ở đây tôi giả định interface đó như sau:
export interface UpdateLabelRequest {
  name?: string;
  colorCode?: string;
}

class LabelService {
  // 1. Lấy danh sách nhãn của dự án
  async getLabels(projectId: number): Promise<Label[]> {
    const response = await apiClient.get<unknown, ApiResponse<Label[]>>(`/projects/${projectId}/labels`);
    if (response && response.result) {
      return response.result;
    }
    return [];
  }

  // 2. Tạo nhãn mới
  async createLabel(projectId: number, data: CreateLabelRequest): Promise<Label> {
    const response = await apiClient.post<unknown, ApiResponse<Label>>(`/projects/${projectId}/labels`, data);
    if (response && response.result) {
      return response.result;
    }
    throw new Error(response?.message || 'Tạo nhãn thất bại');
  }

  // 3. Cập nhật nhãn
  async updateLabel(projectId: number, labelId: number, data: UpdateLabelRequest): Promise<Label> {
    const response = await apiClient.put<unknown, ApiResponse<Label>>(`/projects/${projectId}/labels/${labelId}`, data);
    if (response && response.result) {
      return response.result;
    }
    throw new Error(response?.message || 'Cập nhật nhãn thất bại');
  }

  // 4. Xóa nhãn
  async deleteLabel(projectId: number, labelId: number): Promise<void> {
    await apiClient.delete<unknown, ApiResponse<void>>(`/projects/${projectId}/labels/${labelId}`);
  }
}

export const labelService = new LabelService();