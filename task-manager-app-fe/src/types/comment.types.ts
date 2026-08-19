import { User } from './user.types';

export interface TaskComment {
  id: number;
  taskId: number;
  userId: number;
  content: string;
  createdAt: string;
  user?: User;
}

export interface CreateCommentRequest {
  taskId: number;
  content: string;
}
