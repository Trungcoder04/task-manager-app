import React from 'react';
import { Task } from '../../types/task.types';
import { Badge } from '../common/Badge';
import { Avatar } from '../common/Avatar';
import { Icon } from '../common/Icon';

interface UpcomingTasksProps {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
}

export const UpcomingTasks: React.FC<UpcomingTasksProps> = ({
  tasks,
  onSelectTask,
}) => {
  const pendingTasks = tasks
    .filter((t) => t.status !== 3 && t.dueDate)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 5);

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="dashboard-panel">
      <div className="panel-header">
        <h3 className="panel-title">Hạn chót sắp tới</h3>
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          {pendingTasks.length} việc cần làm
        </span>
      </div>

      {pendingTasks.length === 0 ? (
        <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          🎉 Không có công việc nào sắp đến hạn!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {pendingTasks.map((task) => (
            <div
              key={task.id}
              onClick={() => onSelectTask(task)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                background: 'var(--bg-surface-secondary)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                transition: 'background var(--transition-fast)',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: 0 }}>
                <span
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {task.title}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <Icon name="calendar" size={13} />
                  <span>{formatDate(task.dueDate!)}</span>
                  <Badge priority={task.priority} />
                </div>
              </div>

              {task.assignee && (
                <Avatar name={task.assignee.fullName} src={task.assignee.avatarUrl} size="sm" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
