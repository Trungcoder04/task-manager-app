import { User } from './user.types';

export interface TaskActivity {
  id: number;
  taskId: number;
  userId: number;
  action: string;
  createdAt: string;
  user?: User;
}
