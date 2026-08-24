import React, { useState } from 'react';
import { Project, ProjectMemberRoleType } from '../types/project.types';
import {
  Task,
  TaskFilterOptions,
  TaskStatusType,
  CreateTaskRequest,
  UpdateTaskRequest,
} from '../types/task.types';
import { Label, CreateLabelRequest } from '../types/label.types';
import { TaskFilter } from '../components/tasks/TaskFilter';
import { TaskBoard } from '../components/tasks/TaskBoard';
import { TaskModal } from '../components/tasks/TaskModal';
import { LabelManagerModal } from '../components/tasks/LabelManagerModal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { Button } from '../components/common/Button';

interface BoardPageProps {
  project: Project | null;
  tasks: Task[];
  filteredTasks: Task[];
  labels: Label[];
  filters: TaskFilterOptions;
  isLoading: boolean;
  error: string | null;
  userRole?: ProjectMemberRoleType;
  onFilterChange: (filters: TaskFilterOptions) => void;
  onMoveTask: (taskId: number, newStatus: TaskStatusType) => void;
  onCreateTask: (data: CreateTaskRequest) => Promise<unknown>;
  onUpdateTask: (id: number, data: UpdateTaskRequest) => Promise<unknown>;
  onUpdateStatus?: (taskId: number, newStatus: TaskStatusType, note?: string) => Promise<unknown>;
  onDeleteTask: (id: number) => Promise<void>;
  onAddComment: (taskId: number, content: string) => Promise<unknown>;
  onAddAttachment: (taskId: number, fileName: string, fileUrl: string) => Promise<unknown>;
  onUploadAttachment?: (taskId: number, file: File) => Promise<unknown>;
  onDeleteAttachment: (attachmentId: number, taskId: number) => Promise<void>;
  onCreateLabel: (data: CreateLabelRequest) => Promise<unknown>;
  onDeleteLabel: (labelId: number) => Promise<void>;
  onGoToProjects: () => void;
  selectedTask?: Task | null;
  onClearSelectedTask?: () => void;
}

export const BoardPage: React.FC<BoardPageProps> = ({
  project,
  tasks = [],
  filteredTasks,
  labels,
  filters,
  isLoading,
  error,
  userRole,
  onFilterChange,
  onMoveTask,
  onCreateTask,
  onUpdateTask,
  onUpdateStatus,
  onDeleteTask,
  onAddComment,
  onAddAttachment,
  onUploadAttachment,
  onDeleteAttachment,
  onCreateLabel,
  onDeleteLabel,
  onGoToProjects,
  selectedTask: externalSelectedTask,
  onClearSelectedTask,
}) => {
  const [internalSelectedTask, setInternalSelectedTask] = useState<Task | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [initialColumnStatus, setInitialColumnStatus] = useState<TaskStatusType>(1);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);

  const activeTaskId = externalSelectedTask?.id || internalSelectedTask?.id;
  const activeTask =
    (activeTaskId ? tasks.find((t) => t.id === activeTaskId) : null) ||
    externalSelectedTask ||
    internalSelectedTask;

  if (isLoading) {
    return <LoadingSpinner text="Đang tải dữ liệu Bảng Kanban..." />;
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ color: 'var(--priority-high)', marginBottom: '1rem', fontWeight: 600 }}>
          {error}
        </div>
        <Button variant="secondary" onClick={() => window.location.reload()}>
          Thử lại
        </Button>
      </div>
    );
  }

  if (!project) {
    return (
      <EmptyState
        icon="folder"
        title="Chưa chọn Dự án"
        description="Hãy chọn hoặc tạo một dự án mới để mở bảng Kanban."
        action={
          <Button variant="primary" icon="plus" onClick={onGoToProjects}>
            Tạo dự án mới
          </Button>
        }
      />
    );
  }

  const projectMembers = (project.members || [])
    .map((m) => m.user)
    .filter((u): u is NonNullable<typeof u> => Boolean(u));

  const handleQuickAdd = (status: TaskStatusType) => {
    setInternalSelectedTask(null);
    if (onClearSelectedTask) onClearSelectedTask();
    setInitialColumnStatus(status);
    setIsTaskModalOpen(true);
  };

  const handleSelectTask = (task: Task) => {
    setInternalSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsTaskModalOpen(false);
    setInternalSelectedTask(null);
    if (onClearSelectedTask) onClearSelectedTask();
  };

  return (
    <div className="board-page">
      {/* Search & Filter Toolbar */}
      <TaskFilter
        filters={filters}
        labels={labels}
        members={projectMembers}
        onChange={onFilterChange}
        onOpenLabelManager={() => setIsLabelModalOpen(true)}
      />

      {/* Main Kanban Board */}
      <TaskBoard
        tasks={filteredTasks}
        onSelectTask={handleSelectTask}
        onMoveTask={onMoveTask}
        onQuickAdd={handleQuickAdd}
      />

      {/* Task Detail / Edit / Create Drawer */}
      <TaskModal
        isOpen={isTaskModalOpen || !!externalSelectedTask}
        onClose={handleCloseModal}
        task={activeTask}
        projectId={project.id}
        members={projectMembers}
        labels={labels}
        initialStatus={initialColumnStatus}
        userRole={userRole}
        onCreateTask={onCreateTask}
        onUpdateTask={onUpdateTask}
        onUpdateStatus={onUpdateStatus}
        onDeleteTask={onDeleteTask}
        onAddComment={onAddComment}
        onAddAttachment={onAddAttachment}
        onUploadAttachment={onUploadAttachment}
        onDeleteAttachment={onDeleteAttachment}
      />

      {/* Label Management Modal */}
      <LabelManagerModal
        isOpen={isLabelModalOpen}
        onClose={() => setIsLabelModalOpen(false)}
        projectId={project.id}
        labels={labels}
        onCreateLabel={onCreateLabel}
        onDeleteLabel={onDeleteLabel}
      />
    </div>
  );
};
