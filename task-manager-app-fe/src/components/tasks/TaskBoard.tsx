import React from 'react';
import { Task, TaskStatus, TaskStatusType } from '../../types/task.types';
import { TaskColumn } from './TaskColumn';

interface TaskBoardProps {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onMoveTask: (taskId: number, newStatus: TaskStatusType) => void;
  onQuickAdd: (status: TaskStatusType) => void;
}

export const KANBAN_COLUMNS: { id: TaskStatusType; title: string; color: string }[] = [
  { id: TaskStatus.PENDING, title: 'Pending', color: '#f59e0b' },
  { id: TaskStatus.TODO, title: 'To Do', color: '#6366f1' },
  { id: TaskStatus.IN_PROGRESS, title: 'In Progress', color: '#3b82f6' },
  { id: TaskStatus.IN_REVIEW, title: 'In review', color: '#8b5cf6' },
  { id: TaskStatus.DONE, title: 'Done', color: '#10b981' },
  { id: TaskStatus.REJECTED, title: 'Rejected', color: '#ef4444' },
];
export const TaskBoard: React.FC<TaskBoardProps> = ({
  tasks,
  onSelectTask,
  onMoveTask,
  onQuickAdd,
}) => {
  return (
    <div className="kanban-grid">
      {KANBAN_COLUMNS.map((column) => {
        const columnTasks = tasks.filter((t) => t.status === column.id);
        return (
          <TaskColumn
            key={column.id}
            title={column.title}
            status={column.id}
            color={column.color}
            tasks={columnTasks}
            onSelectTask={onSelectTask}
            onDropTask={onMoveTask}
            onQuickAdd={onQuickAdd}
          />
        );
      })}
    </div>
  );
};
