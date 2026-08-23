import React, { useState, useRef } from 'react';
import { TaskAttachment } from '../../types/attachment.types';
import { taskAttachmentService } from '../../services/taskAttachmentService';
import { Icon } from '../common/Icon';
import { Button } from '../common/Button';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ConfirmModal } from '../common/ConfirmModal';

interface TaskAttachmentsProps {
  taskId?: number;
  attachments?: TaskAttachment[];
  onUploadFile?: (file: File) => Promise<unknown>;
  onAddAttachment?: (fileName: string, fileUrl: string) => Promise<unknown>;
  onDeleteAttachment: (attachmentId: number) => Promise<void>;
  onCountChange?: (count: number) => void;
}

export const TaskAttachments: React.FC<TaskAttachmentsProps> = ({
  taskId,
  attachments: initialAttachments,
  onUploadFile,
  onAddAttachment,
  onDeleteAttachment,
  onCountChange,
}) => {
  const [attachmentList, setAttachmentList] = useState<TaskAttachment[]>(initialAttachments || []);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [uploadMode, setUploadMode] = useState<'device' | 'url'>('device');
  const [manualFileName, setManualFileName] = useState('');
  const [manualFileUrl, setManualFileUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [deletingAtt, setDeletingAtt] = useState<{ id: number; fileName: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAttachments = React.useCallback(async () => {
    if (!taskId) return;
    setIsFetching(true);
    try {
      const data = await taskAttachmentService.getAttachments(taskId);
      setAttachmentList(data);
      onCountChange?.(data.length);
    } catch (err) {
      console.warn('Lỗi tải tệp đính kèm:', err);
    } finally {
      setIsFetching(false);
    }
  }, [taskId, onCountChange]);

  React.useEffect(() => {
    if (taskId) {
      void fetchAttachments();
    } else if (initialAttachments) {
      setAttachmentList(initialAttachments);
      onCountChange?.(initialAttachments.length);
    }
  }, [taskId, fetchAttachments, initialAttachments, onCountChange]);

  // Format file size
  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes === 0) return '';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Format upload time
  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '';
    const date = new Date(timeStr);
    return date.toLocaleDateString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Get file icon and color
  const getFileStyle = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) {
      return { color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', label: ext.toUpperCase() };
    }
    if (['pdf'].includes(ext)) {
      return { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', label: 'PDF' };
    }
    if (['doc', 'docx', 'txt', 'md'].includes(ext)) {
      return { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', label: 'DOC' };
    }
    if (['xls', 'xlsx', 'csv'].includes(ext)) {
      return { color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', label: 'XLS' };
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
      return { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', label: 'ZIP' };
    }
    return { color: '#6366f1', bg: 'rgba(99, 102, 241, 0.1)', label: ext.toUpperCase() || 'FILE' };
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleUploadFromDevice = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    try {
      if (onUploadFile) {
        await onUploadFile(selectedFile);
      } else if (taskId) {
        await taskAttachmentService.uploadAttachment(taskId, selectedFile);
      }
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setIsAdding(false);
      void fetchAttachments();
    } catch (err) {
      console.error('Lỗi upload file:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadFromUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualFileName.trim()) return;

    setIsLoading(true);
    try {
      if (onAddAttachment) {
        await onAddAttachment(
          manualFileName.trim(),
          manualFileUrl.trim() || `https://storage.example.com/files/${encodeURIComponent(manualFileName)}`,
        );
      }
      setManualFileName('');
      setManualFileUrl('');
      setIsAdding(false);
      void fetchAttachments();
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (attachment: TaskAttachment) => {
    setDownloadingId(attachment.id);
    try {
      const presignedUrl = await taskAttachmentService.getPresignedUrl(attachment.id);
      window.open(presignedUrl, '_blank');
    } catch {
      window.open(attachment.fileUrl, '_blank');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>
            Tập tin đính kèm
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
            {attachmentList.length}
          </span>
        </div>

        <Button
          variant="secondary"
          size="sm"
          icon="plus"
          onClick={() => setIsAdding(!isAdding)}
        >
          {isAdding ? 'Đóng' : 'Đính kèm tệp'}
        </Button>
      </div>

      {/* Upload Box */}
      {isAdding && (
        <div
          style={{
            padding: '1.25rem',
            backgroundColor: 'var(--bg-surface-secondary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {/* Tabs: Từ máy tính / Từ URL */}
          <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            <button
              type="button"
              className={`btn btn-sm ${uploadMode === 'device' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setUploadMode('device')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Icon name="upload" size={14} />
              <span>Từ máy tính</span>
            </button>
            <button
              type="button"
              className={`btn btn-sm ${uploadMode === 'url' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setUploadMode('url')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Icon name="paperclip" size={14} />
              <span>Nhập liên kết URL</span>
            </button>
          </div>

          {/* Mode 1: Chọn file từ máy tính */}
          {uploadMode === 'device' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <input
                ref={fileInputRef}
                type="file"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
                disabled={isLoading}
              />

              {/* Drag & Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: isDragging
                    ? '2px dashed var(--primary-500)'
                    : '2px dashed var(--border-color)',
                  backgroundColor: isDragging
                    ? 'rgba(99, 102, 241, 0.08)'
                    : 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.75rem 1rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <div
                  style={{
                    width: '3rem',
                    height: '3rem',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary-500)',
                  }}
                >
                  <Icon name="upload" size={22} />
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Kéo thả tệp vào đây, hoặc <span style={{ color: 'var(--primary-500)', textDecoration: 'underline' }}>chọn từ máy tính</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Hỗ trợ hình ảnh, PDF, tài liệu Word/Excel, ZIP và các tệp khác
                </div>
              </div>

              {/* Selected File Preview Card */}
              {selectedFile && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    backgroundColor: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                    <Icon name="paperclip" size={18} color="var(--primary-500)" />
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {selectedFile.name}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {formatFileSize(selectedFile.size)}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className="btn btn-ghost btn-icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      title="Hủy chọn file"
                    >
                      <Icon name="x" size={16} />
                    </button>
                    <Button
                      variant="primary"
                      size="sm"
                      icon="upload"
                      onClick={handleUploadFromDevice}
                      isLoading={isLoading}
                    >
                      Tải lên máy chủ
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mode 2: Nhập URL thủ công */}
          {uploadMode === 'url' && (
            <form onSubmit={handleUploadFromUrl} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Tên file (Ví dụ: tai-lieu-thiet-ke.pdf)..."
                value={manualFileName}
                onChange={(e) => setManualFileName(e.target.value)}
                required
                disabled={isLoading}
              />
              <input
                type="url"
                className="form-input"
                placeholder="URL file (https://...)"
                value={manualFileUrl}
                onChange={(e) => setManualFileUrl(e.target.value)}
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
                  Lưu liên kết
                </Button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Attachments List */}
      {isFetching ? (
        <div style={{ padding: '2rem 0' }}>
          <LoadingSpinner text="Đang tải tệp đính kèm..." />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {attachmentList.length === 0 ? (
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
                <Icon name="paperclip" size={20} />
              </div>
              <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                Chưa có tập tin đính kèm nào
              </span>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Nhấn <strong>"Đính kèm tệp"</strong> ở trên để tải file từ máy tính lên.
              </span>
            </div>
          ) : (
            attachmentList.map((att) => {
              const fileStyle = getFileStyle(att.fileName);
              const isDownloading = downloadingId === att.id;

              return (
                <div
                  key={att.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    backgroundColor: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* File Info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                    {/* File Badge Icon */}
                    <div
                      style={{
                        width: '2.25rem',
                        height: '2.25rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: fileStyle.bg,
                        color: fileStyle.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '0.7rem',
                        flexShrink: 0,
                      }}
                    >
                      {fileStyle.label}
                    </div>

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
                        title={att.fileName}
                      >
                        {att.fileName}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Tải lên bởi <strong>{att.uploader?.fullName || 'Người dùng'}</strong>
                        {att.uploadedAt && ` • ${formatTime(att.uploadedAt)}`}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <button
                      type="button"
                      className="btn btn-ghost btn-icon"
                      onClick={() => void handleDownload(att)}
                      disabled={isDownloading}
                      title="Tải xuống / Mở tệp"
                    >
                      <Icon name="download" size={16} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-icon"
                      style={{ color: 'var(--priority-high)' }}
                      onClick={() => setDeletingAtt({ id: att.id, fileName: att.fileName })}
                      title="Xóa tệp đính kèm"
                    >
                      <Icon name="trash" size={16} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={deletingAtt !== null}
        onClose={() => setDeletingAtt(null)}
        onConfirm={async () => {
          if (deletingAtt) {
            await onDeleteAttachment(deletingAtt.id);
            setAttachmentList((prev) => {
              const updated = prev.filter((a) => a.id !== deletingAtt.id);
              onCountChange?.(updated.length);
              return updated;
            });
          }
        }}
        title="Xóa tệp đính kèm"
        message={`Bạn có chắc chắn muốn xóa tệp "${deletingAtt?.fileName}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa tệp"
      />
    </div>
  );
};
