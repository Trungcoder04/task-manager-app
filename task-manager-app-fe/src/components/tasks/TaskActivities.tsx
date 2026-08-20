import React, { useEffect, useState, useCallback } from 'react';
import { TaskActivity } from '../../types/activity.types';
import { taskActivityService } from '../../services/taskActivityService';
import { Avatar } from '../common/Avatar';
import { Icon, IconName } from '../common/Icon';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface TaskActivitiesProps {
  activities?: TaskActivity[];
  taskId?: number;
}

export const TaskActivities: React.FC<TaskActivitiesProps> = ({
  activities: initialActivities,
  taskId,
}) => {
  const [activities, setActivities] = useState<TaskActivity[]>(initialActivities || []);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchActivities = useCallback(async () => {
    if (!taskId) return;
    setIsLoading(true);
    try {
      const data = await taskActivityService.getTaskActivities(taskId);
      setActivities(data);
    } catch (err) {
      console.warn('Lỗi khi tải danh sách hoạt động:', err);
    } finally {
      setIsLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    if (taskId) {
      void fetchActivities();
    } else if (initialActivities) {
      setActivities(initialActivities);
    }
  }, [taskId, fetchActivities]);

  const sorted = [...activities].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

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
    if (diffDays === 1) {
      return `Hôm qua lúc ${date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
    }
    return date.toLocaleDateString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getActionMeta = (action: string): { icon: IconName; color: string; bg: string } => {
    const lower = action.toLowerCase();
    if (lower.includes('tạo') || lower.includes('create')) {
      return { icon: 'plus', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' };
    }
    if (lower.includes('đính kèm') || lower.includes('tệp') || lower.includes('file') || lower.includes('upload')) {
      return { icon: 'paperclip', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)' };
    }
    if (lower.includes('trạng thái') || lower.includes('status') || lower.includes('chuyển')) {
      return { icon: 'check', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)' };
    }
    if (lower.includes('xóa') || lower.includes('delete')) {
      return { icon: 'trash', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' };
    }
    if (lower.includes('ưu tiên') || lower.includes('priority')) {
      return { icon: 'alert-circle', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' };
    }
    return { icon: 'edit', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.12)' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: '0.5rem',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.925rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Lịch sử hoạt động
          </span>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '0.15rem 0.5rem',
              borderRadius: '999px',
              backgroundColor: 'var(--bg-surface-secondary)',
              color: 'var(--text-muted)',
            }}
          >
            {sorted.length}
          </span>
        </div>

        {taskId && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => void fetchActivities()}
            disabled={isLoading}
            title="Làm mới lịch sử"
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8125rem' }}
          >
            <Icon name="clock" size={14} />
            <span>Làm mới</span>
          </button>
        )}
      </div>

      {/* Loading */}
      {isLoading ? (
        <div style={{ padding: '2rem 0' }}>
          <LoadingSpinner text="Đang tải lịch sử hoạt động..." />
        </div>
      ) : sorted.length === 0 ? (
        /* Empty State */
        <div
          style={{
            padding: '2.5rem 1.5rem',
            textAlign: 'center',
            backgroundColor: 'var(--bg-surface-secondary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px dashed var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <div
            style={{
              width: '2.75rem',
              height: '2.75rem',
              borderRadius: '50%',
              backgroundColor: 'var(--bg-surface)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
            }}
          >
            <Icon name="clock" size={20} />
          </div>
          <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
            Chưa có lịch sử hoạt động nào
          </span>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Các thao tác tạo mới, thay đổi trạng thái, tải file sẽ tự động hiển thị ở đây.
          </span>
        </div>
      ) : (
        /* Activities Timeline */
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.875rem',
            position: 'relative',
            paddingLeft: '0.25rem',
          }}
        >
          {sorted.map((act) => {
            const meta = getActionMeta(act.action);
            const userName = act.user?.fullName || act.user?.username || 'Người dùng';
            const userAvatar = act.user?.avatar || act.user?.avatarUrl;

            return (
              <div
                key={act.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.875rem',
                  padding: '0.75rem 1rem',
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-color)',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'background-color 0.2s ease',
                }}
              >
                {/* User Avatar + Mini Action Icon */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <Avatar name={userName} src={userAvatar} size="sm" />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '-4px',
                      right: '-4px',
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      backgroundColor: meta.bg,
                      border: '1.5px solid var(--bg-surface)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: meta.color,
                    }}
                    title={act.action}
                  >
                    <Icon name={meta.icon} size={10} color={meta.color} />
                  </div>
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.5rem',
                      marginBottom: '0.2rem',
                    }}
                  >
                    <span style={{ fontSize: '0.845rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {userName}
                    </span>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        whiteSpace: 'nowrap',
                      }}
                      title={new Date(act.createdAt).toLocaleString('vi-VN')}
                    >
                      {formatRelativeTime(act.createdAt)}
                    </span>
                  </div>

                  <div
                    style={{
                      fontSize: '0.845rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.45,
                      wordBreak: 'break-word',
                    }}
                  >
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
