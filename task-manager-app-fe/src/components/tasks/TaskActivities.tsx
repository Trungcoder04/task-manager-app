import React from 'react';
import { TaskActivity } from '../../types/activity.types';

interface TaskActivitiesProps {
  activities: TaskActivity[];
}

export const TaskActivities: React.FC<TaskActivitiesProps> = ({ activities }) => {
  const sorted = [...activities].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const formatTime = (timeStr: string) => {
    const d = new Date(timeStr);
    return d.toLocaleDateString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>Lịch sử thay đổi</span>

      {sorted.length === 0 ? (
        <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Chưa có lịch sử thay đổi nào.
        </div>
      ) : (
        <div className="activity-list">
          {sorted.map((act) => (
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
