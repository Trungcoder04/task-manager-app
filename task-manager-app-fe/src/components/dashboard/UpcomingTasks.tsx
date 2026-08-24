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
    .filter((t) => t.status !== 4 && t.status !== 5 && t.dueDate)
    .sort(
      (a, b) =>
        new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime(),
    )
    .slice(0, 5);

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getDeadlineStatus = (dueDateStr: string) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const due = new Date(dueDateStr);
    due.setHours(0, 0, 0, 0);

    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        statusText: 'Quá hạn',
        bg: 'rgba(239, 68, 68, 0.08)',
        borderColor: 'rgba(239, 68, 68, 0.25)',
        badgeBg: '#ef4444',
        textColor: '#dc2626',
      };
    }
    if (diffDays <= 7) {
      return {
        statusText: 'Sắp đến hạn',
        bg: 'rgba(245, 158, 11, 0.08)',
        borderColor: 'rgba(245, 158, 11, 0.25)',
        badgeBg: '#f59e0b',
        textColor: '#d97706',
      };
    }
    return null;
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
        <div
          style={{
            padding: '1.5rem',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '0.875rem',
          }}
        >
          🎉 Không có công việc nào sắp đến hạn!
        </div>
      ) : (
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
        >
          {pendingTasks.map((task) => {
            const deadline = task.dueDate
              ? getDeadlineStatus(task.dueDate)
              : null;
            return (
              <div
                key={task.id}
                onClick={() => onSelectTask(task)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  background: deadline
                    ? deadline.bg
                    : 'var(--bg-surface-secondary)',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${deadline ? deadline.borderColor : 'var(--border-color)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem',
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
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
                    {deadline && (
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          fontWeight: 800,
                          padding: '0.15rem 0.55rem',
                          borderRadius: '999px',
                          backgroundColor: deadline.badgeBg,
                          color: '#ffffff',
                          letterSpacing: '0.02em',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                        }}
                      >
                        {deadline.statusText}
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.75rem',
                      color: deadline ? deadline.textColor : 'var(--text-muted)',
                    }}
                  >
                    <Icon name="calendar" size={13} />
                    <span style={{ fontWeight: deadline ? 600 : 400 }}>
                      {formatDate(task.dueDate!)}
                    </span>
                    <Badge priority={task.priority} />
                  </div>
                </div>

                {task.assignee && (
                  <Avatar
                    name={task.assignee.fullName}
                    src={task.assignee.avatarUrl}
                    size="sm"
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
