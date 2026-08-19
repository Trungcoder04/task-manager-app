import React from 'react';
import { Task } from '../../types/task.types';
import { TaskActivity } from '../../types/activity.types';

interface RecentActivitiesProps {
  tasks: Task[];
}

export const RecentActivities: React.FC<RecentActivitiesProps> = ({ tasks }) => {
  const allActivities: TaskActivity[] = tasks
    .flatMap((t) => t.activities || [])
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr);
    return date.toLocaleDateString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
    });
  };

  return (
    <div className="dashboard-panel">
      <div className="panel-header">
        <h3 className="panel-title">Hoạt động gần đây</h3>
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Lịch sử thao tác</span>
      </div>

      {allActivities.length === 0 ? (
        <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Chưa có hoạt động nào được ghi nhận.
        </div>
      ) : (
        <div className="activity-list">
          {allActivities.map((act) => (
            <div key={act.id} className="activity-item">
              <div className="activity-dot" />
              <div style={{ flex: 1 }}>
                <div className="activity-text">{act.action}</div>
                <div className="activity-time">{formatTime(act.createdAt)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
