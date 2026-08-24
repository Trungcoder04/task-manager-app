export class UserResponse {
  id: number;
  username: string;
  fullName: string;
  email?: string;
  avatar?: string;
  status?: number;
  role?: number;
  createdAt: Date;
}
