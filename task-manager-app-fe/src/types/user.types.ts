export interface User {
  id: number;
  username: string;
  fullName: string;
  email?: string;
  createdAt: string;
  avatarUrl?: string;
}

export interface UserCreationRequest {
  username: string;
  password: string;
  fullName: string;
  email?: string;
}

export interface UserUpdateRequest {
  password?: string;
  fullName?: string;
  email?: string;
}
