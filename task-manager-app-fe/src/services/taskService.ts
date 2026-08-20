import {
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskStatus,
  TaskPriority,
} from '../types/task.types';
import { Label, CreateLabelRequest } from '../types/label.types';
import { TaskComment } from '../types/comment.types';
import { TaskAttachment } from '../types/attachment.types';
import { INITIAL_TASKS, INITIAL_LABELS, INITIAL_USERS } from './mockData';
import { apiClient } from './apiClient';
import { ApiResponse } from '../types/api.types';

const TASKS_STORAGE_KEY = 'task_manager_tasks';
const LABELS_STORAGE_KEY = 'task_manager_labels';

class TaskService {
  private getStoredTasks(): Task[] {
    const data = localStorage.getItem(TASKS_STORAGE_KEY);
    if (!data) {
      localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(INITIAL_TASKS));
      return INITIAL_TASKS;
    }
    return JSON.parse(data) as Task[];
  }

  private saveTasks(tasks: Task[]): void {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
  }

  private getStoredLabels(): Label[] {
    const data = localStorage.getItem(LABELS_STORAGE_KEY);
    if (!data) {
      localStorage.setItem(LABELS_STORAGE_KEY, JSON.stringify(INITIAL_LABELS));
      return INITIAL_LABELS;
    }
    return JSON.parse(data) as Label[];
  }

  private saveLabels(labels: Label[]): void {
    localStorage.setItem(LABELS_STORAGE_KEY, JSON.stringify(labels));
  }

  async getTasks(projectId?: number): Promise<Task[]> {
    if (projectId) {
      try {
        const response = await apiClient.get<unknown, ApiResponse<Task[]>>(
          `/projects/${projectId}/tasks`,
        );
        if (response && Array.isArray(response.result)) {
          return response.result;
        }
      } catch (err) {
        console.warn('API getTasks failed, falling back to local:', err);
      }
    }
    const tasks = this.getStoredTasks();
    return projectId ? tasks.filter((t) => t.projectId === projectId) : tasks;
  }

  async getTask(id: number): Promise<Task> {
    try {
      const response = await apiClient.get<unknown, ApiResponse<Task>>(
        `/tasks/${id}`,
      );
      if (response && response.result) {
        return response.result;
      }
    } catch (err) {
      console.warn('API getTask failed, falling back to local:', err);
    }
    const tasks = this.getStoredTasks();
    const task = tasks.find((t) => t.id === id);
    if (!task) return Promise.reject(new Error('Không tìm thấy công việc'));
    return task;
  }

  async createTask(data: CreateTaskRequest, creatorId: number): Promise<Task> {
    try {
      const response = await apiClient.post<unknown, ApiResponse<Task>>(
        '/tasks',
        data,
      );
      if (response && response.result) {
        return response.result;
      }
    } catch (err) {
      if (err instanceof Error) {
        throw err;
      }
    }

    const tasks = this.getStoredTasks();
    const allLabels = this.getStoredLabels();
    const assignee = data.assigneeId
      ? INITIAL_USERS.find((u) => u.id === data.assigneeId)
      : undefined;
    const creator =
      INITIAL_USERS.find((u) => u.id === creatorId) || INITIAL_USERS[0];
    const selectedLabels = data.labelIds
      ? allLabels.filter((l) => data.labelIds?.includes(l.id))
      : [];

    const newTask: Task = {
      id: Date.now(),
      projectId: data.projectId,
      title: data.title,
      description: data.description,
      status: data.status ?? TaskStatus.TODO,
      priority: data.priority ?? TaskPriority.MEDIUM,
      dueDate: data.dueDate,
      assigneeId: data.assigneeId,
      orderIndex: tasks.filter((t) => t.projectId === data.projectId).length,
      createdAt: new Date().toISOString(),
      assignee,
      labels: selectedLabels,
      comments: [],
      attachments: [],
      activities: [
        {
          id: Date.now(),
          taskId: Date.now(),
          userId: creator.id,
          action: `${creator.fullName} đã tạo Task`,
          createdAt: new Date().toISOString(),
          user: creator,
        },
      ],
    };

    tasks.push(newTask);
    this.saveTasks(tasks);
    return newTask;
  }

  async updateTask(
    id: number,
    data: UpdateTaskRequest,
    updaterId?: number,
  ): Promise<Task> {
    try {
      const response = await apiClient.put<unknown, ApiResponse<Task>>(
        `/tasks/${id}`,
        data,
      );
      if (response && response.result) {
        return response.result;
      }
    } catch (err) {
      if (err instanceof Error) {
        throw err;
      }
    }

    const tasks = this.getStoredTasks();
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1)
      return Promise.reject(new Error('Không tìm thấy công việc'));

    const current = tasks[index];
    const allLabels = this.getStoredLabels();
    const updater = updaterId
      ? INITIAL_USERS.find((u) => u.id === updaterId) || INITIAL_USERS[0]
      : INITIAL_USERS[0];

    const newActivities = [...(current.activities || [])];

    if (data.status !== undefined && data.status !== current.status) {
      const statusMap: Record<number, string> = {
        1: 'Todo',
        2: 'Doing',
        3: 'Done',
      };
      newActivities.push({
        id: Date.now(),
        taskId: id,
        userId: updater.id,
        action: `${updater.fullName} đổi Status: ${statusMap[current.status]} → ${statusMap[data.status]}`,
        createdAt: new Date().toISOString(),
        user: updater,
      });
    }

    if (data.priority !== undefined && data.priority !== current.priority) {
      const priorityMap: Record<number, string> = {
        1: 'Low',
        2: 'Medium',
        3: 'High',
      };
      newActivities.push({
        id: Date.now() + 1,
        taskId: id,
        userId: updater.id,
        action: `${updater.fullName} đổi Priority: ${priorityMap[current.priority]} → ${priorityMap[data.priority]}`,
        createdAt: new Date().toISOString(),
        user: updater,
      });
    }

    const updatedAssignee =
      data.assigneeId !== undefined
        ? (INITIAL_USERS.find((u) => u.id === data.assigneeId) ?? undefined)
        : current.assignee;

    const updatedLabels =
      data.labelIds !== undefined
        ? allLabels.filter((l) => data.labelIds?.includes(l.id))
        : current.labels;

    tasks[index] = {
      ...current,
      title: data.title ?? current.title,
      description: data.description ?? current.description,
      status: data.status ?? current.status,
      priority: data.priority ?? current.priority,
      dueDate: data.dueDate ?? current.dueDate,
      assigneeId:
        data.assigneeId !== undefined
          ? (data.assigneeId ?? undefined)
          : current.assigneeId,
      assignee: updatedAssignee,
      labels: updatedLabels,
      orderIndex: data.orderIndex ?? current.orderIndex,
      activities: newActivities,
    };

    this.saveTasks(tasks);
    return tasks[index];
  }

  async deleteTask(id: number): Promise<void> {
    try {
      await apiClient.delete(`/tasks/${id}`);
      return;
    } catch (err) {
      console.warn('API deleteTask failed, falling back to local:', err);
    }
    const tasks = this.getStoredTasks().filter((t) => t.id !== id);
    this.saveTasks(tasks);
  }

  addComment(
    taskId: number,
    userId: number,
    content: string,
  ): Promise<TaskComment> {
    const tasks = this.getStoredTasks();
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return Promise.reject(new Error('Task không tồn tại'));

    const user =
      INITIAL_USERS.find((u) => u.id === userId) || INITIAL_USERS[0];
    const newComment: TaskComment = {
      id: Date.now(),
      taskId,
      userId,
      content,
      createdAt: new Date().toISOString(),
      user,
    };

    task.comments = [...(task.comments || []), newComment];
    this.saveTasks(tasks);
    return Promise.resolve(newComment);
  }

  deleteComment(commentId: number, taskId: number): Promise<void> {
    const tasks = this.getStoredTasks();
    const task = tasks.find((t) => t.id === taskId);
    if (task && task.comments) {
      task.comments = task.comments.filter((c) => c.id !== commentId);
      this.saveTasks(tasks);
    }
    return Promise.resolve();
  }

  addAttachment(
    taskId: number,
    uploaderId: number,
    fileName: string,
    fileUrl: string,
  ): Promise<TaskAttachment> {
    const tasks = this.getStoredTasks();
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return Promise.reject(new Error('Task không tồn tại'));

    const uploader =
      INITIAL_USERS.find((u) => u.id === uploaderId) || INITIAL_USERS[0];
    const newAttachment: TaskAttachment = {
      id: Date.now(),
      taskId,
      uploaderId,
      fileName,
      fileUrl,
      uploadedAt: new Date().toISOString(),
      uploader,
    };

    task.attachments = [...(task.attachments || []), newAttachment];
    this.saveTasks(tasks);
    return Promise.resolve(newAttachment);
  }

  deleteAttachment(attachmentId: number, taskId: number): Promise<void> {
    const tasks = this.getStoredTasks();
    const task = tasks.find((t) => t.id === taskId);
    if (task && task.attachments) {
      task.attachments = task.attachments.filter((a) => a.id !== attachmentId);
      this.saveTasks(tasks);
    }
    return Promise.resolve();
  }

  async getLabels(projectId?: number): Promise<Label[]> {
    if (projectId) {
      try {
        const response = await apiClient.get<unknown, ApiResponse<Label[]>>(
          `/projects/${projectId}/labels`,
        );
        if (response && Array.isArray(response.result)) {
          return response.result;
        }
        if (Array.isArray(response)) {
          return response;
        }
      } catch (err) {
        console.warn('API getLabels failed, falling back to local:', err);
      }
    }
    const labels = this.getStoredLabels();
    return projectId
      ? labels.filter((l) => l.projectId === projectId)
      : labels;
  }

  async createLabel(data: CreateLabelRequest): Promise<Label> {
    try {
      const response = await apiClient.post<unknown, ApiResponse<Label>>(
        `/projects/${data.projectId}/labels`,
        {
          name: data.name,
          colorCode: data.colorCode || '#6366f1',
        },
      );
      if (response && response.result) {
        return response.result;
      }
      if (response && (response as unknown as Label).id) {
        return response as unknown as Label;
      }
    } catch (err) {
      if (err instanceof Error) {
        throw err;
      }
    }

    const labels = this.getStoredLabels();
    const newLabel: Label = {
      id: Date.now(),
      projectId: data.projectId,
      name: data.name,
      colorCode: data.colorCode || '#6366f1',
    };
    labels.push(newLabel);
    this.saveLabels(labels);
    return newLabel;
  }

  async deleteLabel(id: number, projectId?: number): Promise<void> {
    if (projectId) {
      try {
        await apiClient.delete(`/projects/${projectId}/labels/${id}`);
        return;
      } catch (err) {
        console.warn('API deleteLabel failed, falling back to local:', err);
      }
    }
    const labels = this.getStoredLabels().filter((l) => l.id !== id);
    this.saveLabels(labels);
  }
}

export const taskService = new TaskService();
