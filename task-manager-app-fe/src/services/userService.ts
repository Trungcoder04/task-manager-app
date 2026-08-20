import { ApiResponse } from '../types/api.types';
import { User, UserUpdateRequest } from '../types/user.types';
import apiClient from './apiClient';

class UserService {
  async getUsers(): Promise<User[]> {
    try {
      const res = await apiClient.get<unknown, ApiResponse<User[]>>('/users');
      if (res && res.result) {
        return res.result;
      }
      return [];
    } catch {
      return [];
    }
  }

  async getUser(id: number): Promise<User> {
    const res = await apiClient.get<unknown, ApiResponse<User>>(`/users/${id}`);
    if (res && res.result) {
      return res.result;
    }
    throw new Error(res?.message || 'User not found');
  }

  async updateUser(id: number, data: UserUpdateRequest): Promise<User> {
    const res = await apiClient.put<unknown, ApiResponse<User>>(`/users/${id}`, data);
    if (res && res.result) {
      return res.result;
    }
    throw new Error(res?.message || 'Cập nhật thất bại');
  }

  async uploadAvatar(userId: number, file: File): Promise<{ avatar: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post<unknown, ApiResponse<{ avatar: string }>>(
      `/users/${userId}/avatar`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );
    if (res && res.result) {
      return res.result;
    }
    throw new Error(res?.message || 'Tải ảnh đại diện thất bại');
  }
}

export const userService = new UserService();

