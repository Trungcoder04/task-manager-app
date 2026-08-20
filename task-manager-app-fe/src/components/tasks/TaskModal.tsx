import React, { useState, useEffect } from 'react';
import { Task, TaskPriorityType, TaskStatusType, CreateTaskRequest, UpdateTaskRequest } from '../../types/task.types';
import { User } from '../../types/user.types';
import { Label } from '../../types/label.types';
import { Button } from '../common/Button';
import { Icon } from '../common/Icon';
import { TaskComments } from './TaskComments';
import { TaskAttachments } from './TaskAttachments';
import { TaskActivities } from './TaskActivities';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task | null;
  projectId: number;
  members: User[];
  labels: Label[];
  initialStatus?: TaskStatusType;
  onCreateTask: (data: CreateTaskRequest) => Promise<unknown>;
  onUpdateTask: (id: number, data: UpdateTaskRequest) => Promise<unknown>;
  onDeleteTask: (id: number) => Promise<void>;
  onAddComment: (taskId: number, content: string) => Promise<unknown>;
  onAddAttachment: (taskId: number, fileName: string, fileUrl: string) => Promise<unknown>;
  onUploadAttachment?: (taskId: number, file: File) => Promise<unknown>;
  onDeleteAttachment: (attachmentId: number, taskId: number) => Promise<void>;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  task,
  projectId,
  members,
  labels,
  initialStatus = 1,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  onAddComment,
  onAddAttachment,
  onUploadAttachment,
  onDeleteAttachment,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatusType>(1);
  const [priority, setPriority] = useState<TaskPriorityType>(2);
  const [dueDate, setDueDate] = useState('');
  const [assigneeId, setAssigneeId] = useState<number | ''>('');
  const [selectedLabelIds, setSelectedLabelIds] = useState<number[]>([]);
  const [isSelectingLabels, setIsSelectingLabels] = useState(false);
  const [activeTab, setActiveTab] = useState<'comments' | 'attachments' | 'activities'>('comments');
  const [isLoading, setIsLoading] = useState(false);

  const [commentsCount, setCommentsCount] = useState<number>(0);
  const [attachmentsCount, setAttachmentsCount] = useState<number>(0);
  const [activitiesCount, setActivitiesCount] = useState<number>(0);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setStatus(task.status);
      setPriority(task.priority);
      setDueDate(task.dueDate ? task.dueDate.split('T')[0] : '');
      setAssigneeId(task.assigneeId || '');
      setSelectedLabelIds((task.labels || []).map((l) => l.id));

      if (task.comments !== undefined) {
        setCommentsCount(task.comments.length);
      } else if (task._count?.comments !== undefined) {
        setCommentsCount(task._count.comments);
      }

      if (task.attachments !== undefined) {
        setAttachmentsCount(task.attachments.length);
      } else if (task._count?.attachments !== undefined) {
        setAttachmentsCount(task._count.attachments);
      }

      if (task.activities !== undefined) {
        setActivitiesCount(task.activities.length);
      } else if (task._count?.activities !== undefined) {
        setActivitiesCount(task._count.activities);
      }
    } else {
      setTitle('');
      setDescription('');
      setStatus(initialStatus);
      setPriority(2);
      setDueDate('');
      setAssigneeId('');
      setSelectedLabelIds([]);
      setCommentsCount(0);
      setAttachmentsCount(0);
      setActivitiesCount(0);
    }
    setIsSelectingLabels(false);
  }, [task, initialStatus, isOpen]);

  if (!isOpen) return null;

  const isEditing = !!task;

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim()) return;

    if (isEditing && task) {
      const originalDueDate = task.dueDate ? task.dueDate.split('T')[0] : '';
      const originalAssigneeId = task.assigneeId || '';
      const originalLabelIds = (task.labels || []).map((l) => l.id).sort().join(',');
      const currentLabelIds = [...selectedLabelIds].sort().join(',');

      const hasTitleChanged = title.trim() !== task.title;
      const hasDescChanged = (description.trim() || '') !== (task.description || '');
      const hasStatusChanged = status !== task.status;
      const hasPriorityChanged = priority !== task.priority;
      const hasDueDateChanged = (dueDate || '') !== originalDueDate;
      const hasAssigneeChanged = (assigneeId || '') !== originalAssigneeId;
      const hasLabelsChanged = originalLabelIds !== currentLabelIds;

      // Nếu không có bất kỳ thay đổi nào -> đóng modal ngay, không gọi API!
      if (
        !hasTitleChanged &&
        !hasDescChanged &&
        !hasStatusChanged &&
        !hasPriorityChanged &&
        !hasDueDateChanged &&
        !hasAssigneeChanged &&
        !hasLabelsChanged
      ) {
        onClose();
        return;
      }

      setIsLoading(true);
      try {
        await onUpdateTask(task.id, {
          title: title.trim(),
          description: description.trim() || undefined,
          status,
          priority,
          dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
          assigneeId: assigneeId ? Number(assigneeId) : null,
          labelIds: selectedLabelIds,
        });
        onClose();
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(true);
      try {
        await onCreateTask({
          projectId,
          title: title.trim(),
          description: description.trim() || undefined,
          status,
          priority,
          dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
          assigneeId: assigneeId ? Number(assigneeId) : undefined,
          labelIds: selectedLabelIds,
        });
        onClose();
      } finally {
        setIsLoading(false);
      }
    }
  };

  const toggleLabel = (labelId: number) => {
    setSelectedLabelIds((prev) =>
      prev.includes(labelId) ? prev.filter((id) => id !== labelId) : [...prev, labelId],
    );
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.5rem',
            borderBottom: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-surface)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.2rem 0.5rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: isEditing ? 'rgba(99, 102, 241, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                color: isEditing ? 'var(--primary-500)' : '#10b981',
              }}
            >
              {isEditing ? `#${task.id}` : 'MỚI'}
            </span>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              {isEditing ? 'Chi tiết công việc' : 'Tạo công việc mới'}
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Button
              variant="primary"
              size="sm"
              icon="check"
              onClick={() => void handleSave()}
              isLoading={isLoading}
            >
              {isEditing ? 'Lưu thay đổi' : 'Tạo công việc'}
            </Button>

            {isEditing && task && (
              <Button
                variant="danger"
                size="icon"
                icon="trash"
                onClick={() => {
                  if (confirm('Bạn có chắc chắn muốn xóa công việc này?')) {
                    void onDeleteTask(task.id);
                    onClose();
                  }
                }}
                title="Xóa công việc"
              />
            )}

            <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close" title="Đóng">
              <Icon name="x" size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          {/* Top Form: Compact & Clean Layout */}
          <form
            onSubmit={handleSave}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.875rem',
              backgroundColor: 'var(--bg-surface-secondary)',
              padding: '1rem 1.25rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
            }}
          >
            {/* Title */}
            <div className="form-group" style={{ margin: 0 }}>
              <input
                type="text"
                className="form-input"
                placeholder="Tiêu đề công việc..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={isLoading}
                style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  backgroundColor: 'var(--bg-surface)',
                  padding: '0.625rem 0.875rem',
                }}
              />
            </div>

            {/* 4 Metadata Fields in Compact Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '0.75rem',
              }}
            >
              {/* Trạng thái */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem', color: 'var(--text-muted)' }}>
                  Trạng thái
                </label>
                <select
                  className="form-select"
                  value={status}
                  onChange={(e) => setStatus(Number(e.target.value) as TaskStatusType)}
                  disabled={isLoading}
                  style={{ fontSize: '0.8125rem', padding: '0.45rem 0.65rem' }}
                >
                  <option value={1}>TODO</option>
                  <option value={2}>DOING</option>
                  <option value={3}>DONE</option>
                </select>
              </div>

              {/* Độ ưu tiên */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem', color: 'var(--text-muted)' }}>
                  Độ ưu tiên
                </label>
                <select
                  className="form-select"
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value) as TaskPriorityType)}
                  disabled={isLoading}
                  style={{ fontSize: '0.8125rem', padding: '0.45rem 0.65rem' }}
                >
                  <option value={3}>🔴 Cao (High)</option>
                  <option value={2}>🟡 Trung bình (Medium)</option>
                  <option value={1}>🟢 Thấp (Low)</option>
                </select>
              </div>

              {/* Người thực hiện */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem', color: 'var(--text-muted)' }}>
                  Người thực hiện
                </label>
                <select
                  className="form-select"
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value ? Number(e.target.value) : '')}
                  disabled={isLoading}
                  style={{ fontSize: '0.8125rem', padding: '0.45rem 0.65rem' }}
                >
                  <option value="">-- Chưa chỉ định --</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Hạn chót */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem', color: 'var(--text-muted)' }}>
                  Hạn chót
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  disabled={isLoading}
                  style={{ fontSize: '0.8125rem', padding: '0.45rem 0.65rem' }}
                />
              </div>
            </div>

            {/* Label selection */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <label className="form-label" style={{ fontSize: '0.75rem', margin: 0, color: 'var(--text-muted)' }}>
                  Nhãn dán (Labels)
                </label>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ fontSize: '0.75rem', padding: '0.15rem 0.45rem', color: 'var(--primary-500)' }}
                  onClick={() => setIsSelectingLabels(!isSelectingLabels)}
                >
                  <Icon name={isSelectingLabels ? 'x' : 'plus'} size={13} />
                  <span>{isSelectingLabels ? 'Đóng chọn nhãn' : 'Chọn nhãn'}</span>
                </button>
              </div>

              {/* Display attached labels only */}
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', minHeight: '28px', alignItems: 'center' }}>
                {selectedLabelIds.length === 0 ? (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    Chưa có nhãn nào được gắn
                  </span>
                ) : (
                  labels
                    .filter((lbl) => selectedLabelIds.includes(lbl.id))
                    .map((lbl) => (
                      <span
                        key={lbl.id}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          padding: '0.15rem 0.55rem',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.725rem',
                          fontWeight: 700,
                          backgroundColor: lbl.colorCode || '#6366f1',
                          color: '#ffffff',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                        }}
                      >
                        {lbl.name}
                        <span
                          style={{ cursor: 'pointer', opacity: 0.85, marginLeft: '2px' }}
                          onClick={() => toggleLabel(lbl.id)}
                          title="Bỏ nhãn này"
                        >
                          ✕
                        </span>
                      </span>
                    ))
                )}
              </div>

              {/* Expandable panel to pick from all project labels */}
              {isSelectingLabels && (
                <div
                  style={{
                    marginTop: '0.5rem',
                    padding: '0.65rem 0.75rem',
                    background: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ fontSize: '0.725rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                    Nhấp để chọn hoặc bỏ nhãn:
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {labels.map((lbl) => {
                      const isSelected = selectedLabelIds.includes(lbl.id);
                      return (
                        <button
                          key={lbl.id}
                          type="button"
                          onClick={() => toggleLabel(lbl.id)}
                          style={{
                            padding: '0.2rem 0.6rem',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.725rem',
                            fontWeight: 700,
                            border: `1px solid ${lbl.colorCode || '#6366f1'}`,
                            background: isSelected ? (lbl.colorCode || '#6366f1') : 'transparent',
                            color: isSelected ? '#ffffff' : (lbl.colorCode || '#6366f1'),
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          {isSelected ? '✓ ' : '+ '} {lbl.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="form-group" style={{ margin: 0 }}>
              <textarea
                className="form-textarea"
                rows={2}
                placeholder="Thêm mô tả công việc, yêu cầu kỹ thuật hoặc ghi chú ngắn..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLoading}
                style={{
                  fontSize: '0.845rem',
                  padding: '0.5rem 0.75rem',
                  resize: 'vertical',
                }}
              />
            </div>
          </form>

          {/* Bottom Tabs: Comments, Attachments & History */}
          {isEditing && task && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)',
                padding: '1.25rem',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              {/* Tab Navigation */}
              <div
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  borderBottom: '1px solid var(--border-color)',
                  paddingBottom: '0.75rem',
                }}
              >
                <button
                  type="button"
                  className={`btn btn-sm ${activeTab === 'comments' ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setActiveTab('comments')}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Icon name="message-square" size={15} />
                  <span>Bình luận</span>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      padding: '0.1rem 0.45rem',
                      borderRadius: '999px',
                      backgroundColor: activeTab === 'comments' ? 'rgba(255,255,255,0.25)' : 'var(--bg-surface-secondary)',
                    }}
                  >
                    {commentsCount}
                  </span>
                </button>

                <button
                  type="button"
                  className={`btn btn-sm ${activeTab === 'attachments' ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setActiveTab('attachments')}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Icon name="paperclip" size={15} />
                  <span>Tập tin</span>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      padding: '0.1rem 0.45rem',
                      borderRadius: '999px',
                      backgroundColor: activeTab === 'attachments' ? 'rgba(255,255,255,0.25)' : 'var(--bg-surface-secondary)',
                    }}
                  >
                    {attachmentsCount}
                  </span>
                </button>

                <button
                  type="button"
                  className={`btn btn-sm ${activeTab === 'activities' ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setActiveTab('activities')}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Icon name="clock" size={15} />
                  <span>Lịch sử</span>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      padding: '0.1rem 0.45rem',
                      borderRadius: '999px',
                      backgroundColor: activeTab === 'activities' ? 'rgba(255,255,255,0.25)' : 'var(--bg-surface-secondary)',
                    }}
                  >
                    {activitiesCount}
                  </span>
                </button>
              </div>

              {/* Tab Content */}
              <div>
                {activeTab === 'comments' && (
                  <TaskComments
                    taskId={task.id}
                    comments={task.comments}
                    onAddComment={async (content) => {
                      await onAddComment(task.id, content);
                    }}
                    onCountChange={setCommentsCount}
                  />
                )}

                {activeTab === 'attachments' && (
                  <TaskAttachments
                    taskId={task.id}
                    attachments={task.attachments || []}
                    onUploadFile={async (file) => {
                      if (onUploadAttachment) {
                        await onUploadAttachment(task.id, file);
                      }
                    }}
                    onAddAttachment={async (fn, fu) => {
                      await onAddAttachment(task.id, fn, fu);
                    }}
                    onDeleteAttachment={(attId) => onDeleteAttachment(attId, task.id)}
                    onCountChange={setAttachmentsCount}
                  />
                )}

                {activeTab === 'activities' && (
                  <TaskActivities
                    taskId={task.id}
                    onCountChange={setActivitiesCount}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
