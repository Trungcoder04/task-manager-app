import { apiClient } from './apiClient';
import { ApiResponse } from '../types/api.types';
import { TaskComment } from '../types/comment.types';
import { Task } from '../types/task.types';
import { INITIAL_USERS } from './mockData';

const TASKS_STORAGE_KEY = 'task_manager_tasks';

class TaskCommentService {
  /**
   * Lấy danh sách bình luận của 1 Task
   */
  async getComments(taskId: number): Promise<TaskComment[]> {
    try {
      const response = await apiClient.get<unknown, ApiResponse<TaskComment[]>>(
        `/tasks/${taskId}/comments`,
      );
      if (response && Array.isArray(response.result)) {
        return response.result;
      }
    } catch (err) {
      console.warn('API getComments failed, falling back to local:', err);
    }

    // Fallback to local storage
    try {
      const data = localStorage.getItem(TASKS_STORAGE_KEY);
      if (data) {
        const tasks = JSON.parse(data) as Task[];
        const task = tasks.find((t) => t.id === taskId);
        return task?.comments || [];
      }
    } catch {
      // Ignore parse error
    }

    return [];
  }

  /**
   * Thêm bình luận mới vào Task
   */
  async addComment(taskId: number, content: string, currentUserId: number = 1): Promise<TaskComment> {
    try {
      const response = await apiClient.post<unknown, ApiResponse<TaskComment>>(
        `/tasks/${taskId}/comments`,
        { content },
      );
      if (response && response.result) {
        return response.result;
      }
    } catch (err) {
      console.warn('API addComment failed, falling back to local:', err);
    }

    // Fallback to local storage
    const data = localStorage.getItem(TASKS_STORAGE_KEY);
    const tasks: Task[] = data ? JSON.parse(data) : [];
    const task = tasks.find((t) => t.id === taskId);

    const user =
      INITIAL_USERS.find((u) => u.id === currentUserId) || INITIAL_USERS[0];
    const newComment: TaskComment = {
      id: Date.now(),
      taskId,
      userId: currentUserId,
      content,
      createdAt: new Date().toISOString(),
      user,
    };

    if (task) {
      task.comments = [...(task.comments || []), newComment];
      localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
    }

    return newComment;
  }

  /**
   * Xóa bình luận
   */
  async deleteComment(taskId: number, commentId: number): Promise<void> {
    try {
      await apiClient.delete(`/tasks/${taskId}/comments/${commentId}`);
      return;
    } catch (err) {
      console.warn('API deleteComment failed, falling back to local:', err);
    }

    const data = localStorage.getItem(TASKS_STORAGE_KEY);
    if (data) {
      const tasks: Task[] = JSON.parse(data);
      const task = tasks.find((t) => t.id === taskId);
      if (task && task.comments) {
        task.comments = task.comments.filter((c) => c.id !== commentId);
        localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
      }
    }
  }
}

export const taskCommentService = new TaskCommentService();
