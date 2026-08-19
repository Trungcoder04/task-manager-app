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
  onDeleteAttachment,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatusType>(1);
  const [priority, setPriority] = useState<TaskPriorityType>(2);
  const [dueDate, setDueDate] = useState('');
  const [assigneeId, setAssigneeId] = useState<number | ''>('');
  const [selectedLabelIds, setSelectedLabelIds] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<'comments' | 'attachments' | 'activities'>('comments');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setStatus(task.status);
      setPriority(task.priority);
      setDueDate(task.dueDate ? task.dueDate.split('T')[0] : '');
      setAssigneeId(task.assigneeId || '');
      setSelectedLabelIds((task.labels || []).map((l) => l.id));
    } else {
      setTitle('');
      setDescription('');
      setStatus(initialStatus);
      setPriority(2);
      setDueDate('');
      setAssigneeId('');
      setSelectedLabelIds([]);
    }
  }, [task, initialStatus, isOpen]);

  if (!isOpen) return null;

  const isEditing = !!task;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsLoading(true);
    try {
      if (isEditing && task) {
        await onUpdateTask(task.id, {
          title: title.trim(),
          description: description.trim() || undefined,
          status,
          priority,
          dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
          assigneeId: assigneeId ? Number(assigneeId) : null,
          labelIds: selectedLabelIds,
        });
      } else {
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
      }
      onClose();
    } finally {
      setIsLoading(false);
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
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.125rem', fontWeight: 800 }}>
              {isEditing ? `Chi tiết Công việc #${task.id}` : 'Tạo Công việc Mới'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
            <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close">
              <Icon name="x" size={18} />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Tiêu đề công việc</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ví dụ: Implement Login API"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            {/* Grid 2 Columns for Metadata */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Trạng thái</label>
                <select
                  className="form-select"
                  value={status}
                  onChange={(e) => setStatus(Number(e.target.value) as TaskStatusType)}
                  disabled={isLoading}
                >
                  <option value={1}>TODO</option>
                  <option value={2}>DOING</option>
                  <option value={3}>DONE</option>
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Độ ưu tiên</label>
                <select
                  className="form-select"
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value) as TaskPriorityType)}
                  disabled={isLoading}
                >
                  <option value={3}>🔴 Cao (High)</option>
                  <option value={2}>🟡 Trung bình (Medium)</option>
                  <option value={1}>🟢 Thấp (Low)</option>
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Người thực hiện</label>
                <select
                  className="form-select"
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value ? Number(e.target.value) : '')}
                  disabled={isLoading}
                >
                  <option value="">-- Chưa chỉ định --</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Hạn chót (Due Date)</label>
                <input
                  type="date"
                  className="form-input"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Label selection */}
            <div>
              <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem' }}>
                Nhãn dán (Labels)
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {labels.map((lbl) => {
                  const isSelected = selectedLabelIds.includes(lbl.id);
                  return (
                    <button
                      key={lbl.id}
                      type="button"
                      onClick={() => toggleLabel(lbl.id)}
                      className="label-chip"
                      style={{
                        backgroundColor: isSelected ? lbl.colorCode || '#6366f1' : 'transparent',
                        color: isSelected ? 'white' : lbl.colorCode || '#6366f1',
                        border: `1px solid ${lbl.colorCode || '#6366f1'}`,
                        cursor: 'pointer',
                      }}
                    >
                      {lbl.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Mô tả chi tiết</label>
              <textarea
                className="form-textarea"
                rows={4}
                placeholder="Thêm mô tả công việc, các yêu cầu kỹ thuật hoặc ghi chú..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
                Hủy
              </Button>
              <Button type="submit" variant="primary" isLoading={isLoading}>
                {isEditing ? 'Lưu thay đổi' : 'Tạo công việc'}
              </Button>
            </div>
          </form>

          {/* If Editing, Show Tabs for Comments, Attachments & History */}
          {isEditing && task && (
            <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
              {/* Tab Navigation */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <Button
                  variant={activeTab === 'comments' ? 'primary' : 'ghost'}
                  size="sm"
                  icon="message-square"
                  onClick={() => setActiveTab('comments')}
                >
                  Bình luận ({task.comments?.length || 0})
                </Button>
                <Button
                  variant={activeTab === 'attachments' ? 'primary' : 'ghost'}
                  size="sm"
                  icon="paperclip"
                  onClick={() => setActiveTab('attachments')}
                >
                  Tập tin ({task.attachments?.length || 0})
                </Button>
                <Button
                  variant={activeTab === 'activities' ? 'primary' : 'ghost'}
                  size="sm"
                  icon="clock"
                  onClick={() => setActiveTab('activities')}
                >
                  Lịch sử ({task.activities?.length || 0})
                </Button>
              </div>

              {/* Tab Content */}
              {activeTab === 'comments' && (
                <TaskComments
                  comments={task.comments || []}
                  onAddComment={async (content) => {
                    await onAddComment(task.id, content);
                  }}
                />
              )}

              {activeTab === 'attachments' && (
                <TaskAttachments
                  attachments={task.attachments || []}
                  onAddAttachment={async (fn, fu) => {
                    await onAddAttachment(task.id, fn, fu);
                  }}
                  onDeleteAttachment={(attId) => onDeleteAttachment(attId, task.id)}
                />
              )}

              {activeTab === 'activities' && (
                <TaskActivities activities={task.activities || []} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
