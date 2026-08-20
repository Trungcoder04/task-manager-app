import { apiClient } from './apiClient';
import { ApiResponse } from '../types/api.types';
import { User, UserUpdateRequest } from '../types/user.types';

const USER_STORAGE_KEY = 'task_manager_user';

class UserService {
  async getUsers(): Promise<User[]> {
    const response = await apiClient.get<unknown, ApiResponse<User[]>>('/users');
    if (response && response.result) {
      return response.result;
    }
    return [];
  }

  async getUser(id: number): Promise<User> {
    const response = await apiClient.get<unknown, ApiResponse<User>>(`/users/${id}`);
    if (response && response.result) {
      return response.result;
    }
    throw new Error(response?.message || 'Không tìm thấy người dùng');
  }

  async updateUser(id: number, data: UserUpdateRequest): Promise<User> {
    const response = await apiClient.put<unknown, ApiResponse<User>>(`/users/${id}`, data);
    
    if (response && response.result) {
      const updatedUser = response.result;

      // Giữ nguyên logic update lại thông tin session nếu người dùng đang tự sửa profile của chính mình
      const currentUserStr = localStorage.getItem(USER_STORAGE_KEY);
      if (currentUserStr) {
        const currentUser = JSON.parse(currentUserStr) as User;
        if (currentUser.id === id) {
          // Lưu lại thông tin mới nhất vào localStorage để Header/Sidebar cập nhật ngay lập tức
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
        }
      }

      return updatedUser;
    }
    throw new Error(response?.message || 'Cập nhật thông tin thất bại');
  }

  async deleteUser(id: number): Promise<void> {
    await apiClient.delete<unknown, ApiResponse<void>>(`/users/${id}`);
  }
}

export const userService = new UserService();