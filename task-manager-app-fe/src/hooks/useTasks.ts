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
import { taskAttachmentService } from '../services/taskAttachmentService';
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
    assignerId: 'ALL',
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

  useEffect(() => {
    setFilters({
      search: '',
      status: 'ALL',
      priority: 'ALL',
      assigneeId: 'ALL',
      assignerId: 'ALL',
      labelId: 'ALL',
    });
  }, [projectId]);

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

      // Assignee filter (Người thực hiện)
      if (filters.assigneeId && filters.assigneeId !== 'ALL' && task.assigneeId !== filters.assigneeId) {
        return false;
      }

      // Assigner filter (Người giao việc)
      if (filters.assignerId && filters.assignerId !== 'ALL' && task.assignerId !== filters.assignerId) {
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
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                ...updated,
                comments: updated.comments ?? t.comments,
                attachments: updated.attachments ?? t.attachments,
                activities: updated.activities ?? t.activities,
                _count: updated._count ?? t._count,
                labels: updated.labels ?? t.labels,
              }
            : t,
        ),
      );
      return updated;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Cập nhật công việc thất bại';
      showToast(msg, 'error');
      throw err;
    }
  };

  const updateTaskStatus = async (
    taskId: number,
    newStatus: TaskStatusType,
    note?: string,
  ) => {
    try {
      const updated = await taskService.updateTaskStatus(
        taskId,
        newStatus,
        note,
        currentUserId || 1,
      );
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, ...updated, status: newStatus } : t)),
      );
      showToast('Cập nhật trạng thái thành công!', 'success');
      return updated;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Cập nhật trạng thái thất bại';
      showToast(msg, 'error');
      throw err;
    }
  };

  const moveTaskStatus = async (taskId: number, newStatus: TaskStatusType) => {
    const currentTask = tasks.find((t) => t.id === taskId);
    // Nếu trạng thái không thay đổi -> không cần gọi API
    if (currentTask && currentTask.status === newStatus) {
      return;
    }

    // Optimistic update for fluid drag and drop
    const prevTasks = [...tasks];
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)),
    );

    try {
      await taskService.updateTaskStatus(taskId, newStatus, undefined, currentUserId || 1);
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
      const newAttachment = await taskAttachmentService.addAttachment(
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
      await taskAttachmentService.deleteAttachment(attachmentId, taskId);
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

  const uploadAttachment = async (taskId: number, file: File) => {
    try {
      const newAttachment = await taskAttachmentService.uploadAttachment(taskId, file);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, attachments: [...(t.attachments || []), newAttachment] }
            : t,
        ),
      );
      showToast(`Đã tải lên tệp ${file.name}!`, 'success');
      return newAttachment;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Tải lên tệp thất bại';
      showToast(msg, 'error');
      throw err;
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
      await taskService.deleteLabel(labelId, projectId);
      setLabels((prev) => prev.filter((l) => l.id !== labelId));
      showToast('Đã xóa nhãn!', 'info');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Xóa nhãn thất bại';
      showToast(msg, 'error');
    }
  };

  const requestExtension = async (taskId: number, newDueDate: string, reason: string) => {
    try {
      const updated = await taskService.requestExtension(taskId, newDueDate, reason);
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, ...updated } : t)),
      );
      showToast('Đã gửi yêu cầu xin gia hạn deadline!', 'success');
      return updated;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gửi yêu cầu gia hạn thất bại';
      showToast(msg, 'error');
      throw err;
    }
  };

  const reviewExtension = async (
    taskId: number,
    extensionId: number,
    status: number,
    reviewNote?: string,
  ) => {
    try {
      const updated = await taskService.reviewExtension(taskId, extensionId, status, reviewNote);
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, ...updated } : t)),
      );
      const actionName = status === 1 ? 'Đã chấp thuận gia hạn deadline!' : 'Đã từ chối gia hạn deadline!';
      showToast(actionName, status === 1 ? 'success' : 'info');
      return updated;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Xử lý yêu cầu gia hạn thất bại';
      showToast(msg, 'error');
      throw err;
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
    updateTaskStatus,
    moveTaskStatus,
    deleteTask,
    addComment,
    addAttachment,
    uploadAttachment,
    deleteAttachment,
    createLabel,
    deleteLabel,
    requestExtension,
    reviewExtension,
  };
};
