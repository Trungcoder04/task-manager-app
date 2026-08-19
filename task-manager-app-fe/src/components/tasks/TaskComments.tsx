import React, { useState } from 'react';
import { TaskComment } from '../../types/comment.types';
import { Avatar } from '../common/Avatar';
import { Button } from '../common/Button';

interface TaskCommentsProps {
  comments: TaskComment[];
  onAddComment: (content: string) => Promise<void>;
}

export const TaskComments: React.FC<TaskCommentsProps> = ({
  comments,
  onAddComment,
}) => {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsLoading(true);
    try {
      await onAddComment(content.trim());
      setContent('');
    } finally {
      setIsLoading(false);
    }
  };

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <textarea
          className="form-textarea"
          rows={3}
          placeholder="Viết bình luận hoặc trao đổi tiến độ..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={isLoading}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={!content.trim() || isLoading}
            isLoading={isLoading}
          >
            Gửi bình luận
          </Button>
        </div>
      </form>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {comments.length === 0 ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Chưa có bình luận nào. Hãy bắt đầu cuộc trò chuyện!
          </div>
        ) : (
          comments.map((cmt) => (
            <div
              key={cmt.id}
              style={{
                display: 'flex',
                gap: '0.75rem',
                padding: '0.875rem',
                background: 'var(--bg-surface-secondary)',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <Avatar
                name={cmt.user?.fullName || 'User'}
                src={cmt.user?.avatarUrl}
                size="sm"
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {cmt.user?.fullName || 'User'}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {formatTime(cmt.createdAt)}
                  </span>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>
                  {cmt.content}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
