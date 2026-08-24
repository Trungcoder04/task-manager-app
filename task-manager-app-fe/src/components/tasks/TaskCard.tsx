import React, { useState } from 'react';
import { Task, TaskStatus } from '../../types/task.types';
import { Badge } from '../common/Badge';
import { Avatar } from '../common/Avatar';
import { Icon } from '../common/Icon';

interface TaskCardProps {
  task: Task;
  onSelect: (task: Task) => void;
  onDragStart: (e: React.DragEvent, taskId: number) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onSelect,
  onDragStart,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.setData('text/plain', String(task.id));
    onDragStart(e, task.id);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  };

  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate).getTime() < Date.now() &&
    task.status !== TaskStatus.DONE;

  const isReworked =
    task.status === TaskStatus.TODO &&
    (task.activities?.some((a) => a.action.toLowerCase().includes('làm lại')) || false);

  return (
    <div
      className={`task-card ${isDragging ? 'is-dragging' : ''}`}
      style={isReworked ? { borderColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.03)' } : undefined}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={() => onSelect(task)}
    >
      <div className="task-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Badge priority={task.priority} />
          {isReworked && (
            <span
              style={{
                fontSize: '0.625rem',
                fontWeight: 800,
                backgroundColor: '#fef3c7',
                color: '#d97706',
                border: '1px solid #fde68a',
                borderRadius: '4px',
                padding: '0.05rem 0.35rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.2rem',
              }}
              title="Công việc này vừa được Admin yêu cầu làm lại"
            >
              ⚠️ Cần làm lại
            </span>
          )}
        </div>
        {task.labels && task.labels.length > 0 && (
          <div className="task-labels-wrap">
            {task.labels.map((lbl) => (
              <span
                key={lbl.id}
                className="label-chip"
                style={{
                  backgroundColor: `${lbl.colorCode || '#6366f1'}1f`,
                  color: lbl.colorCode || '#6366f1',
                  border: `1px solid ${lbl.colorCode || '#6366f1'}4d`,
                }}
              >
                {lbl.name}
              </span>
            ))}
          </div>
        )}
      </div>

      <h4 className="task-card-title">{task.title}</h4>

      {task.description && (
        <p className="task-card-desc">{task.description}</p>
      )}

      <div className="task-card-footer">
        <div className="task-meta-left">
          {task.dueDate && (
            <div className={`meta-item ${isOverdue ? 'meta-overdue' : ''}`}>
              <Icon name="calendar" size={13} />
              <span>{formatDate(task.dueDate)}</span>
            </div>
          )}

          {/* File đính kèm */}
          {(() => {
            const attCount = task._count?.attachments ?? task.attachments?.length ?? 0;
            return attCount > 0 ? (
              <div className="meta-item" title={`${attCount} tệp đính kèm`}>
                <Icon name="paperclip" size={13} />
                <span>{attCount}</span>
              </div>
            ) : null;
          })()}

          {/* Bình luận */}
          {(() => {
            const cmtCount = task._count?.comments ?? task.comments?.length ?? 0;
            return cmtCount > 0 ? (
              <div className="meta-item" title={`${cmtCount} bình luận`}>
                <Icon name="message-square" size={13} />
                <span>{cmtCount}</span>
              </div>
            ) : null;
          })()}

          {/* Lịch sử hoạt động */}
          {(() => {
            const actCount = task._count?.activities ?? task.activities?.length ?? 0;
            return actCount > 0 ? (
              <div className="meta-item" title={`${actCount} lịch sử hoạt động`}>
                <Icon name="clock" size={13} />
                <span>{actCount}</span>
              </div>
            ) : null;
          })()}
        </div>

        {task.assignee ? (
          <Avatar
            name={task.assignee.fullName}
            src={task.assignee.avatarUrl}
            size="sm"
          />
        ) : (
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Chưa giao</span>
        )}
      </div>
    </div>
  );
};
