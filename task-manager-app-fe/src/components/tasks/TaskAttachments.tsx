import React, { useState } from 'react';
import { TaskAttachment } from '../../types/attachment.types';
import { Icon } from '../common/Icon';
import { Button } from '../common/Button';

interface TaskAttachmentsProps {
  attachments: TaskAttachment[];
  onAddAttachment: (fileName: string, fileUrl: string) => Promise<void>;
  onDeleteAttachment: (attachmentId: number) => Promise<void>;
}

export const TaskAttachments: React.FC<TaskAttachmentsProps> = ({
  attachments,
  onAddAttachment,
  onDeleteAttachment,
}) => {
  const [fileName, setFileName] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName.trim()) return;

    setIsLoading(true);
    try {
      await onAddAttachment(
        fileName.trim(),
        fileUrl.trim() || `https://storage.example.com/files/${encodeURIComponent(fileName)}`,
      );
      setFileName('');
      setFileUrl('');
      setIsAdding(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>
          Tập tin đính kèm ({attachments.length})
        </span>
        <Button
          variant="secondary"
          size="sm"
          icon="plus"
          onClick={() => setIsAdding(!isAdding)}
        >
          {isAdding ? 'Đóng' : 'Đính kèm file'}
        </Button>
      </div>

      {isAdding && (
        <form
          onSubmit={handleUploadSubmit}
          style={{
            padding: '1rem',
            background: 'var(--bg-surface-secondary)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          <input
            type="text"
            className="form-input"
            placeholder="Tên file (Ví dụ: design-spec.pdf, api-doc.docx)..."
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            required
            disabled={isLoading}
          />
          <input
            type="url"
            className="form-input"
            placeholder="URL file (Tùy chọn: https://...)"
            value={fileUrl}
            onChange={(e) => setFileUrl(e.target.value)}
            disabled={isLoading}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsAdding(false)}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isLoading}
            >
              Tải lên
            </Button>
          </div>
        </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        {attachments.length === 0 ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Chưa có tập tin đính kèm nào.
          </div>
        ) : (
          attachments.map((att) => (
            <div
              key={att.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                background: 'var(--bg-surface-secondary)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', minWidth: 0 }}>
                <Icon name="paperclip" size={16} color="var(--primary-500)" />
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <span
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {att.fileName}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Bởi {att.uploader?.fullName || 'User'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <a
                  href={att.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-ghost btn-icon"
                  title="Tải / Xem file"
                >
                  <Icon name="download" size={16} />
                </a>
                <button
                  className="btn btn-ghost btn-icon"
                  style={{ color: 'var(--priority-high)' }}
                  onClick={() => onDeleteAttachment(att.id)}
                  title="Xóa file"
                >
                  <Icon name="trash" size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
