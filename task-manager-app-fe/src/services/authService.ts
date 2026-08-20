import { apiClient } from './apiClient';
import { ApiResponse } from '../types/api.types';
import { AuthResponse, LoginRequest, RegisterRequest } from '../types/auth.types';
import { User } from '../types/user.types';

const USER_STORAGE_KEY = 'task_manager_user';
const TOKEN_STORAGE_KEY = 'auth_token';

class AuthService {
  async login(request: LoginRequest): Promise<{ token: string; user: User }> {
    const response = await apiClient.post<unknown, ApiResponse<AuthResponse>>('/auth/token', request);
    if (response && response.result?.token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, response.result.token);
      const myInfo = await this.getMyInfo();
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(myInfo));
      return { token: response.result.token, user: myInfo };
    }
    throw new Error(response?.message || 'Tài khoản hoặc mật khẩu không chính xác');
  }

  async register(request: RegisterRequest): Promise<User> {
    const response = await apiClient.post<unknown, ApiResponse<User>>('/users', request);
    if (response && response.result) {
      return response.result;
    }
    throw new Error(response?.message || 'Đăng ký không thành công');
  }

  async getMyInfo(): Promise<User> {
    const response = await apiClient.get<unknown, ApiResponse<User>>('/users/my-info');
    if (response && response.result) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.result));
      return response.result;
    }
    throw new Error('Không lấy được thông tin người dùng');
  }

  getStoredUser(): User | null {
    const cached = localStorage.getItem(USER_STORAGE_KEY);
    return cached ? (JSON.parse(cached) as User) : null;
  }

  getStoredToken(): string | null {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  }

  setStoredUser(user: User): void {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  }

  logout(): void {
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

export const authService = new AuthService();
