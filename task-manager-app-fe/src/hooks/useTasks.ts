import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskFilterOptions,
  TaskStatusType,
} from '../types/task.types';
import { Label, CreateLabelRequest } from '../types/label.types';
import { taskService } from '../services/taskService';
import { useToast } from './useToast';

export const useTasks = (projectId?: number, currentUserId?: number) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TaskFilterOptions>({
    search: '',
    status: 'ALL',
    priority: 'ALL',
    assigneeId: 'ALL',
    labelId: 'ALL',
  });
  const { showToast } = useToast();

  const fetchData = useCallback(async () => {
    if (!projectId) {
      setTasks([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const [tasksData, labelsData] = await Promise.all([
        taskService.getTasks(projectId),
        taskService.getLabels(projectId),
      ]);
      setTasks(tasksData);
      setLabels(labelsData);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể tải công việc';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [projectId, showToast]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // Filtered tasks logic
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Search filter (title or description)
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const matchTitle = task.title.toLowerCase().includes(query);
        const matchDesc = task.description?.toLowerCase().includes(query) || false;
        if (!matchTitle && !matchDesc) return false;
      }

      // Status filter
      if (filters.status && filters.status !== 'ALL' && task.status !== filters.status) {
        return false;
      }

      // Priority filter
      if (filters.priority && filters.priority !== 'ALL' && task.priority !== filters.priority) {
        return false;
      }

      // Assignee filter
      if (filters.assigneeId && filters.assigneeId !== 'ALL' && task.assigneeId !== filters.assigneeId) {
        return false;
      }

      // Label filter
      if (filters.labelId && filters.labelId !== 'ALL') {
        const hasLabel = task.labels?.some((l) => l.id === filters.labelId);
        if (!hasLabel) return false;
      }

      return true;
    });
  }, [tasks, filters]);

  const createTask = async (data: CreateTaskRequest) => {
    try {
      const newTask = await taskService.createTask(data, currentUserId || 1);
      setTasks((prev) => [...prev, newTask]);
      showToast('Đã tạo công việc mới!', 'success');
      return newTask;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Tạo công việc thất bại';
      showToast(msg, 'error');
      throw err;
    }
  };

  const updateTask = async (id: number, data: UpdateTaskRequest) => {
    try {
      const updated = await taskService.updateTask(id, data, currentUserId || 1);
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
      return updated;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Cập nhật công việc thất bại';
      showToast(msg, 'error');
      throw err;
    }
  };

  const moveTaskStatus = async (taskId: number, newStatus: TaskStatusType) => {
    // Optimistic update for fluid drag and drop
    const prevTasks = [...tasks];
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)),
    );

    try {
      await taskService.updateTask(taskId, { status: newStatus }, currentUserId || 1);
      showToast(`Đã chuyển trạng thái công việc!`, 'info');
    } catch (err) {
      setTasks(prevTasks); // Rollback
      const msg = err instanceof Error ? err.message : 'Chuyển trạng thái thất bại';
      showToast(msg, 'error');
    }
  };

  const deleteTask = async (id: number) => {
    try {
      await taskService.deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      showToast('Đã xóa công việc!', 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Xóa công việc thất bại';
      showToast(msg, 'error');
      throw err;
    }
  };

  const addComment = async (taskId: number, content: string) => {
    try {
      const newComment = await taskService.addComment(taskId, currentUserId || 1, content);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, comments: [...(t.comments || []), newComment] }
            : t,
        ),
      );
      showToast('Đã thêm bình luận!', 'success');
      return newComment;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Thêm bình luận thất bại';
      showToast(msg, 'error');
      throw err;
    }
  };

  const addAttachment = async (taskId: number, fileName: string, fileUrl: string) => {
    try {
      const newAttachment = await taskService.addAttachment(
        taskId,
        currentUserId || 1,
        fileName,
        fileUrl,
      );
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, attachments: [...(t.attachments || []), newAttachment] }
            : t,
        ),
      );
      showToast('Đã đính kèm file!', 'success');
      return newAttachment;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Đính kèm file thất bại';
      showToast(msg, 'error');
      throw err;
    }
  };

  const deleteAttachment = async (attachmentId: number, taskId: number) => {
    try {
      await taskService.deleteAttachment(attachmentId, taskId);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, attachments: (t.attachments || []).filter((a) => a.id !== attachmentId) }
            : t,
        ),
      );
      showToast('Đã xóa file đính kèm!', 'info');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Xóa file thất bại';
      showToast(msg, 'error');
    }
  };

  const createLabel = async (data: CreateLabelRequest) => {
    try {
      const newLabel = await taskService.createLabel(data);
      setLabels((prev) => [...prev, newLabel]);
      showToast('Tạo nhãn thành công!', 'success');
      return newLabel;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Tạo nhãn thất bại';
      showToast(msg, 'error');
      throw err;
    }
  };

  const deleteLabel = async (labelId: number) => {
    try {
      await taskService.deleteLabel(labelId);
      setLabels((prev) => prev.filter((l) => l.id !== labelId));
      showToast('Đã xóa nhãn!', 'info');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Xóa nhãn thất bại';
      showToast(msg, 'error');
    }
  };

  return {
    tasks,
    filteredTasks,
    labels,
    isLoading,
    error,
    filters,
    setFilters,
    refreshTasks: fetchData,
    createTask,
    updateTask,
    moveTaskStatus,
    deleteTask,
    addComment,
    addAttachment,
    deleteAttachment,
    createLabel,
    deleteLabel,
  };
};
