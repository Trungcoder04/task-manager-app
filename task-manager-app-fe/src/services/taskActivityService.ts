import { apiClient } from './apiClient';
import { ApiResponse } from '../types/api.types';
import { TaskActivity } from '../types/activity.types';
import { Task } from '../types/task.types';

const TASKS_STORAGE_KEY = 'task_manager_tasks';

class TaskActivityService {

  async getTaskActivities(taskId: number): Promise<TaskActivity[]> {
    try {
      const response = await apiClient.get<unknown, ApiResponse<TaskActivity[]>>(
        `/tasks/${taskId}/activities`,
      );
      if (response && Array.isArray(response.result)) {
        return response.result;
      }
    } catch (err) {
      console.warn('API getTaskActivities failed, falling back to local:', err);
    }

    // Fallback to local storage
    try {
      const data = localStorage.getItem(TASKS_STORAGE_KEY);
      if (data) {
        const tasks = JSON.parse(data) as Task[];
        const task = tasks.find((t) => t.id === taskId);
        return task?.activities || [];
      }
    } catch {
      // Ignore JSON parse errors
    }

    return [];
  }
}

export const taskActivityService = new TaskActivityService();
