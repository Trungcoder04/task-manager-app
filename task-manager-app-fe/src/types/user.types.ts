export interface User {
  id: number;
  username: string;
  fullName: string;
  email?: string;
  status?: number; // 1: Active, 2: Locked, 3: Disabled
  role?: number; // 1: Admin, 2: User
  createdAt: string;
  avatar?: string;
  avatarUrl?: string;
}

export interface UserCreationRequest {
  username: string;
  password: string;
  fullName: string;
  email?: string;
  status?: number;
  role?: number;
}

export interface UserUpdateRequest {
  password?: string;
  fullName?: string;
  email?: string;
  status?: number;
  role?: number;
  oldPassword?: string;
}
