import { User } from './user.types';
import { Label } from './label.types';
import { TaskComment } from './comment.types';
import { TaskAttachment } from './attachment.types';
import { TaskActivity } from './activity.types';

export const TaskStatus = {
  PENDING: 0,
  TODO: 1,
  IN_PROGRESS: 2,
  IN_REVIEW: 3,
  DONE: 4,
  REJECTED: 5,
} as const;

export type TaskStatusType = (typeof TaskStatus)[keyof typeof TaskStatus];

export const TaskPriority = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
} as const;

export type TaskPriorityType = (typeof TaskPriority)[keyof typeof TaskPriority];

export const TaskStatusLabel: Record<TaskStatusType, { label: string; color: string; badge: string }> = {
  [TaskStatus.PENDING]: { label: 'Chờ duyệt', color: '#f59e0b', badge: 'warning' },
  [TaskStatus.TODO]: { label: 'Cần làm', color: '#6366f1', badge: 'info' },
  [TaskStatus.IN_PROGRESS]: { label: 'Đang làm', color: '#3b82f6', badge: 'primary' },
  [TaskStatus.IN_REVIEW]: { label: 'Chờ nghiệm thu', color: '#8b5cf6', badge: 'purple' },
  [TaskStatus.DONE]: { label: 'Hoàn thành', color: '#10b981', badge: 'success' },
  [TaskStatus.REJECTED]: { label: 'Bị từ chối', color: '#ef4444', badge: 'danger' },
};

export interface Task {
  id: number;
  projectId: number;
  title: string;
  description?: string;
  status: TaskStatusType;
  priority: TaskPriorityType;
  dueDate?: string;
  assigneeId?: number;
  orderIndex: number;
  createdAt: string;
  assignee?: User;
  labels?: Label[];
  comments?: TaskComment[];
  attachments?: TaskAttachment[];
  activities?: TaskActivity[];
  _count?: {
    comments?: number;
    attachments?: number;
    activities?: number;
  };
}

export interface CreateTaskRequest {
  projectId: number;
  title: string;
  description?: string;
  status?: TaskStatusType;
  priority?: TaskPriorityType;
  dueDate?: string;
  assigneeId?: number;
  labelIds?: number[];
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: TaskStatusType;
  priority?: TaskPriorityType;
  dueDate?: string;
  assigneeId?: number | null;
  orderIndex?: number;
  labelIds?: number[];
}

export interface TaskFilterOptions {
  search?: string;
  status?: TaskStatusType | 'ALL';
  priority?: TaskPriorityType | 'ALL';
  assigneeId?: number | 'ALL';
  labelId?: number | 'ALL';
}
