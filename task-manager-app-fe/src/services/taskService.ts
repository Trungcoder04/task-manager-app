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

  getTasks(projectId?: number): Promise<Task[]> {
    const tasks = this.getStoredTasks();
    const result = projectId ? tasks.filter((t) => t.projectId === projectId) : tasks;
    return Promise.resolve(result);
  }

  getTask(id: number): Promise<Task> {
    const tasks = this.getStoredTasks();
    const task = tasks.find((t) => t.id === id);
    if (!task) return Promise.reject(new Error('Không tìm thấy công việc'));
    return Promise.resolve(task);
  }

  createTask(data: CreateTaskRequest, creatorId: number): Promise<Task> {
    const tasks = this.getStoredTasks();
    const allLabels = this.getStoredLabels();
    const assignee = data.assigneeId
      ? INITIAL_USERS.find((u) => u.id === data.assigneeId)
      : undefined;
    const creator = INITIAL_USERS.find((u) => u.id === creatorId) || INITIAL_USERS[0];
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
    return Promise.resolve(newTask);
  }

  updateTask(
    id: number,
    data: UpdateTaskRequest,
    updaterId?: number,
  ): Promise<Task> {
    const tasks = this.getStoredTasks();
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) return Promise.reject(new Error('Không tìm thấy công việc'));

    const current = tasks[index];
    const allLabels = this.getStoredLabels();
    const updater = updaterId
      ? INITIAL_USERS.find((u) => u.id === updaterId) || INITIAL_USERS[0]
      : INITIAL_USERS[0];

    const newActivities = [...(current.activities || [])];

    // Audit logs
    if (data.status !== undefined && data.status !== current.status) {
      const statusMap: Record<number, string> = { 1: 'Todo', 2: 'Doing', 3: 'Done' };
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
      const priorityMap: Record<number, string> = { 1: 'Low', 2: 'Medium', 3: 'High' };
      newActivities.push({
        id: Date.now() + 1,
        taskId: id,
        userId: updater.id,
        action: `${updater.fullName} đổi Priority: ${priorityMap[current.priority]} → ${priorityMap[data.priority]}`,
        createdAt: new Date().toISOString(),
        user: updater,
      });
    }

    if (data.assigneeId !== undefined && data.assigneeId !== current.assigneeId) {
      const newAssignee = data.assigneeId
        ? INITIAL_USERS.find((u) => u.id === data.assigneeId)
        : null;
      newActivities.push({
        id: Date.now() + 2,
        taskId: id,
        userId: updater.id,
        action: newAssignee
          ? `${updater.fullName} đã giao Task cho ${newAssignee.fullName}`
          : `${updater.fullName} đã hủy người thực hiện Task`,
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
      assigneeId: data.assigneeId !== undefined ? (data.assigneeId ?? undefined) : current.assigneeId,
      assignee: updatedAssignee,
      labels: updatedLabels,
      orderIndex: data.orderIndex ?? current.orderIndex,
      activities: newActivities,
    };

    this.saveTasks(tasks);
    return Promise.resolve(tasks[index]);
  }

  deleteTask(id: number): Promise<void> {
    const tasks = this.getStoredTasks().filter((t) => t.id !== id);
    this.saveTasks(tasks);
    return Promise.resolve();
  }

  addComment(taskId: number, userId: number, content: string): Promise<TaskComment> {
    const tasks = this.getStoredTasks();
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return Promise.reject(new Error('Task không tồn tại'));

    const user = INITIAL_USERS.find((u) => u.id === userId) || INITIAL_USERS[0];
    const newComment: TaskComment = {
      id: Date.now(),
      taskId,
      userId,
      content,
      createdAt: new Date().toISOString(),
      user,
    };

    if (!task.comments) task.comments = [];
    task.comments.push(newComment);
    this.saveTasks(tasks);
    return Promise.resolve(newComment);
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

    const uploader = INITIAL_USERS.find((u) => u.id === uploaderId) || INITIAL_USERS[0];
    const newAttachment: TaskAttachment = {
      id: Date.now(),
      taskId,
      uploaderId,
      fileName,
      fileUrl,
      uploadedAt: new Date().toISOString(),
      uploader,
    };

    if (!task.attachments) task.attachments = [];
    task.attachments.push(newAttachment);
    this.saveTasks(tasks);
    return Promise.resolve(newAttachment);
  }

  deleteAttachment(attachmentId: number, taskId: number): Promise<void> {
    const tasks = this.getStoredTasks();
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return Promise.resolve();

    task.attachments = (task.attachments || []).filter((a) => a.id !== attachmentId);
    this.saveTasks(tasks);
    return Promise.resolve();
  }

  getLabels(projectId?: number): Promise<Label[]> {
    const labels = this.getStoredLabels();
    const result = projectId ? labels.filter((l) => l.projectId === projectId) : labels;
    return Promise.resolve(result);
  }

  createLabel(data: CreateLabelRequest): Promise<Label> {
    const labels = this.getStoredLabels();
    const newLabel: Label = {
      id: Date.now(),
      projectId: data.projectId,
      name: data.name.toUpperCase(),
      colorCode: data.colorCode || '#6366f1',
    };
    labels.push(newLabel);
    this.saveLabels(labels);
    return Promise.resolve(newLabel);
  }

  deleteLabel(labelId: number): Promise<void> {
    const labels = this.getStoredLabels().filter((l) => l.id !== labelId);
    this.saveLabels(labels);
    return Promise.resolve();
  }
}

export const taskService = new TaskService();
