import React, { useState } from 'react';
import { Task, TaskStatusType } from '../../types/task.types';
import { TaskCard } from './TaskCard';
import { Button } from '../common/Button';

interface TaskColumnProps {
  title: string;
  status: TaskStatusType;
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onDropTask: (taskId: number, newStatus: TaskStatusType) => void;
  onQuickAdd: (status: TaskStatusType) => void;
}

export const TaskColumn: React.FC<TaskColumnProps> = ({
  title,
  status,
  tasks,
  onSelectTask,
  onDropTask,
  onQuickAdd,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const getDotClass = () => {
    if (status === 1) return 'status-dot-todo';
    if (status === 2) return 'status-dot-doing';
    return 'status-dot-done';
  };

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
      onDropTask(Number(taskIdStr), status);
    }
  };

  return (
    <div className="kanban-column">
      <div className="column-header">
        <div className="column-title-wrap">
          <div className={`status-dot ${getDotClass()}`} />
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
