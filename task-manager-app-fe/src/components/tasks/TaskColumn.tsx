import React, { useState } from 'react';
import { Task, TaskStatusType } from '../../types/task.types';
import { TaskCard } from './TaskCard';
import { Button } from '../common/Button';

interface TaskColumnProps {
  title: string;
  status: TaskStatusType;
  color?: string;
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onDropTask: (taskId: number, newStatus: TaskStatusType) => void;
  onQuickAdd: (status: TaskStatusType) => void;
}

export const TaskColumn: React.FC<TaskColumnProps> = ({
  title,
  status,
  color,
  tasks,
  onSelectTask,
  onDropTask,
  onQuickAdd,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const taskIdStr = e.dataTransfer.getData('text/plain');
    if (taskIdStr) {
      const taskId = Number(taskIdStr);
      // Nếu task đã ở trong cột này thì không cần kích hoạt drop
      const taskAlreadyInColumn = tasks.find((t) => t.id === taskId);
      if (taskAlreadyInColumn && taskAlreadyInColumn.status === status) {
        return;
      }
      onDropTask(taskId, status);
    }
  };

  return (
    <div className="kanban-column">
      <div className="column-header">
        <div className="column-title-wrap">
          <div className="status-dot" style={{ backgroundColor: color || 'var(--primary-500)' }} />
          <span className="column-title">{title}</span>
          <span className="column-badge">{tasks.length}</span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          icon="plus"
          onClick={() => onQuickAdd(status)}
          title={`Thêm công việc vào ${title}`}
        />
      </div>

      <div
        className={`column-tasks ${isDragOver ? 'drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onSelect={onSelectTask}
            onDragStart={(_e, taskId) => {
              // drag start handle
            }}
          />
        ))}

        {tasks.length === 0 && (
          <div
            style={{
              padding: '2.5rem 1rem',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '0.8125rem',
              border: '1px dashed var(--border-color)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            Kéo thả công việc vào đây
          </div>
        )}
      </div>
    </div>
  );
};
