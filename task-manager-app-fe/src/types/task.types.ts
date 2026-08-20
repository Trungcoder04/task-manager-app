import { User } from './user.types';
import { Label } from './label.types';
import { TaskComment } from './comment.types';
import { TaskAttachment } from './attachment.types';
import { TaskActivity } from './activity.types';

export const TaskStatus = {
  TODO: 1,
  DOING: 2,
  DONE: 3,
} as const;

export type TaskStatusType = (typeof TaskStatus)[keyof typeof TaskStatus];

export const TaskPriority = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
} as const;

export type TaskPriorityType = (typeof TaskPriority)[keyof typeof TaskPriority];

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
