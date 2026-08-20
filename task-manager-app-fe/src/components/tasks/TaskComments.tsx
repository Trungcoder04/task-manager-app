import React, { useState, useEffect, useCallback } from 'react';
import { TaskComment } from '../../types/comment.types';
import { taskCommentService } from '../../services/taskCommentService';
import { Avatar } from '../common/Avatar';
import { Button } from '../common/Button';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface TaskCommentsProps {
  taskId?: number;
  comments?: TaskComment[];
  onAddComment?: (content: string) => Promise<unknown>;
}

export const TaskComments: React.FC<TaskCommentsProps> = ({
  taskId,
  comments: initialComments,
  onAddComment,
}) => {
  const [comments, setComments] = useState<TaskComment[]>(initialComments || []);
  const [content, setContent] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchComments = useCallback(async () => {
    if (!taskId) return;
    setIsFetching(true);
    try {
      const data = await taskCommentService.getComments(taskId);
      setComments(data);
    } catch (err) {
      console.warn('Lỗi khi tải bình luận:', err);
    } finally {
      setIsFetching(false);
    }
  }, [taskId]);

  useEffect(() => {
    if (taskId) {
      void fetchComments();
    } else if (initialComments) {
      setComments(initialComments);
    }
  }, [taskId, fetchComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      if (onAddComment) {
        await onAddComment(content.trim());
      } else if (taskId) {
        const newCmt = await taskCommentService.addComment(taskId, content.trim());
        setComments((prev) => [...prev, newCmt]);
      }
      setContent('');
    } finally {
      setIsSubmitting(false);
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
      {/* Form viết bình luận */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <textarea
          className="form-textarea"
          rows={3}
          placeholder="Viết bình luận hoặc trao đổi tiến độ..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={isSubmitting}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={!content.trim() || isSubmitting}
            isLoading={isSubmitting}
          >
            Gửi bình luận
          </Button>
        </div>
      </form>

      {/* Danh sách bình luận */}
      {isFetching ? (
        <div style={{ padding: '2rem 0' }}>
          <LoadingSpinner text="Đang tải bình luận..." />
        </div>
      ) : comments.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Chưa có bình luận nào. Hãy bắt đầu cuộc trao đổi!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {comments.map((cmt) => (
            <div
              key={cmt.id}
              style={{
                display: 'flex',
                gap: '0.75rem',
                padding: '0.875rem 1rem',
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <Avatar
                name={cmt.user?.fullName || cmt.user?.username || 'User'}
                src={cmt.user?.avatar || cmt.user?.avatarUrl}
                size="sm"
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.845rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {cmt.user?.fullName || cmt.user?.username || 'User'}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {formatTime(cmt.createdAt)}
                  </span>
                </div>
                <p style={{ fontSize: '0.845rem', color: 'var(--text-secondary)', lineHeight: 1.45, whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>
                  {cmt.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
