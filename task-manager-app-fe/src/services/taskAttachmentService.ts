import { apiClient } from './apiClient';
import { ApiResponse } from '../types/api.types';
import { TaskAttachment } from '../types/attachment.types';
import { Task } from '../types/task.types';
import { INITIAL_USERS } from './mockData';

const TASKS_STORAGE_KEY = 'task_manager_tasks';

class TaskAttachmentService {
  /**
   * Lấy danh sách tệp đính kèm của 1 Task
   */
  async getAttachments(taskId: number): Promise<TaskAttachment[]> {
    try {
      const response = await apiClient.get<unknown, ApiResponse<TaskAttachment[]>>(
        `/task-attachments/task/${taskId}`,
      );
      if (response && Array.isArray(response.result)) {
        return response.result;
      }
    } catch (err) {
      console.warn('API getAttachments failed, falling back to local:', err);
    }

    // Fallback to local storage
    try {
      const data = localStorage.getItem(TASKS_STORAGE_KEY);
      if (data) {
        const tasks = JSON.parse(data) as Task[];
        const task = tasks.find((t) => t.id === taskId);
        return task?.attachments || [];
      }
    } catch {
      // Ignore parse error
    }

    return [];
  }

  /**
   * Upload tệp đính kèm lên server (sử dụng Multipart/FormData & MinIO)
   */
  async uploadAttachment(taskId: number, file: File): Promise<TaskAttachment> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<unknown, ApiResponse<TaskAttachment>>(
      `/task-attachments/upload/${taskId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );

    if (response && response.result) {
      return response.result;
    }

    throw new Error(response?.message || 'Tải lên tệp đính kèm thất bại');
  }

  /**
   * Thêm tệp đính kèm qua URL / Tên file
   */
  async addAttachment(
    taskId: number,
    uploaderId: number,
    fileName: string,
    fileUrl: string,
  ): Promise<TaskAttachment> {
    const data = localStorage.getItem(TASKS_STORAGE_KEY);
    const tasks: Task[] = data ? JSON.parse(data) : [];
    const task = tasks.find((t) => t.id === taskId);

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

    if (task) {
      task.attachments = [...(task.attachments || []), newAttachment];
      localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
    }

    return Promise.resolve(newAttachment);
  }

  /**
   * Xóa tệp đính kèm
   */
  async deleteAttachment(attachmentId: number, taskId?: number): Promise<void> {
    try {
      await apiClient.delete(`/task-attachments/${attachmentId}`);
      return;
    } catch (err) {
      console.warn('API deleteAttachment failed, falling back to local:', err);
    }

    if (taskId) {
      const data = localStorage.getItem(TASKS_STORAGE_KEY);
      if (data) {
        const tasks: Task[] = JSON.parse(data);
        const task = tasks.find((t) => t.id === taskId);
        if (task && task.attachments) {
          task.attachments = task.attachments.filter((a) => a.id !== attachmentId);
          localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
        }
      }
    }
  }

  /**
   * Lấy Presigned URL để tải file an toàn từ MinIO
   */
  async getPresignedUrl(attachmentId: number): Promise<string> {
    const response = await apiClient.get<unknown, ApiResponse<{ downloadUrl: string }>>(
      `/task-attachments/${attachmentId}/presigned-url`,
    );
    if (response && response.result?.downloadUrl) {
      return response.result.downloadUrl;
    }
    throw new Error('Không thể lấy đường dẫn tải tệp');
  }
}

export const taskAttachmentService = new TaskAttachmentService();
