import React from 'react';
import { Task } from '../../types/task.types';
import { TaskActivity } from '../../types/activity.types';
import { Avatar } from '../common/Avatar';
import { Icon } from '../common/Icon';

interface RecentActivitiesProps {
  tasks: Task[];
}

export const RecentActivities: React.FC<RecentActivitiesProps> = ({ tasks }) => {
  const allActivities: TaskActivity[] = tasks
    .flatMap((t) => t.activities || [])
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);

  const formatRelativeTime = (timeStr: string) => {
    const date = new Date(timeStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays === 1) return 'Hôm qua';
    return date.toLocaleDateString('vi-VN', {
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
        <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          <div style={{ marginBottom: '0.5rem', opacity: 0.5 }}>
            <Icon name="clock" size={24} />
          </div>
          <div>Chưa có hoạt động nào được ghi nhận.</div>
        </div>
      ) : (
        <div className="activity-list">
          {allActivities.map((act) => {
            const userName = act.user?.fullName || act.user?.username || 'Người dùng';
            const userAvatar = act.user?.avatar || act.user?.avatarUrl;

            return (
              <div key={act.id} className="activity-item" style={{ alignItems: 'center' }}>
                <Avatar name={userName} src={userAvatar} size="sm" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
                      {userName}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {formatRelativeTime(act.createdAt)}
                    </span>
                  </div>
                  <div className="activity-text" style={{ fontSize: '0.8125rem' }}>
                    {act.action}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
