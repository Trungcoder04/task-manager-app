import React, { useState, useEffect, useMemo } from 'react';
import { Task, TaskPriorityType, TaskStatusType, CreateTaskRequest, UpdateTaskRequest, TaskStatus } from '../../types/task.types';
import { User } from '../../types/user.types';
import { Label } from '../../types/label.types';
import { ProjectMember, ProjectMemberRoleType } from '../../types/project.types';
import { Button } from '../common/Button';
import { Icon } from '../common/Icon';
import { ConfirmModal } from '../common/ConfirmModal';
import { TaskComments } from './TaskComments';
import { TaskAttachments } from './TaskAttachments';
import { TaskActivities } from './TaskActivities';
import { TaskStatusActions } from './TaskStatusAction';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task | null;
  projectId: number;
  members: User[];
  projectMembers?: ProjectMember[];
  labels: Label[];
  initialStatus?: TaskStatusType;
  userRole?: ProjectMemberRoleType;
  onCreateTask: (data: CreateTaskRequest) => Promise<unknown>;
  onUpdateTask: (id: number, data: UpdateTaskRequest) => Promise<unknown>;
  onUpdateStatus?: (taskId: number, newStatus: TaskStatusType, note?: string) => Promise<unknown>;
  onDeleteTask: (id: number) => Promise<void>;
  onAddComment: (taskId: number, content: string) => Promise<unknown>;
  onAddAttachment: (taskId: number, fileName: string, fileUrl: string) => Promise<unknown>;
  onUploadAttachment?: (taskId: number, file: File) => Promise<unknown>;
  onDeleteAttachment: (attachmentId: number, taskId: number) => Promise<void>;
  onRequestExtension?: (taskId: number, newDueDate: string, reason: string) => Promise<unknown>;
  onReviewExtension?: (taskId: number, extensionId: number, status: number, reviewNote?: string) => Promise<unknown>;
  currentUserId?: number;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  task,
  projectId,
  members,
  projectMembers,
  labels,
  initialStatus = 1,
  userRole,
  onCreateTask,
  onUpdateTask,
  onUpdateStatus,
  onDeleteTask,
  onAddComment,
  onAddAttachment,
  onUploadAttachment,
  onDeleteAttachment,
  onRequestExtension,
  onReviewExtension,
  currentUserId,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatusType>(1);
  const [priority, setPriority] = useState<TaskPriorityType>(2);
  const [dueDate, setDueDate] = useState('');
  const [assigneeId, setAssigneeId] = useState<number | ''>('');
  const [assignerId, setAssignerId] = useState<number | ''>('');
  const [selectedLabelIds, setSelectedLabelIds] = useState<number[]>([]);
  const [isSelectingLabels, setIsSelectingLabels] = useState(false);
  const [activeTab, setActiveTab] = useState<'comments' | 'attachments' | 'activities'>('comments');
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  // States cho tính năng Xin gia hạn Deadline
  const [isExtensionModalOpen, setIsExtensionModalOpen] = useState(false);
  const [extensionNewDueDate, setExtensionNewDueDate] = useState('');
  const [extensionReason, setExtensionReason] = useState('');
  const [extensionError, setExtensionError] = useState('');
  const [isSubmittingExtension, setIsSubmittingExtension] = useState(false);

  // Chỉ lấy những tài khoản có chức vụ Quản trị (Admin - 1) hoặc Trưởng nhóm (Lead - 2) để làm Người giao việc
  const assignerCandidates = useMemo(() => {
    if (!projectMembers || projectMembers.length === 0) {
      return members.filter((m) => m.role === 1);
    }
    const list = members.filter((m) => {
      const pm = projectMembers.find((p) => p.userId === m.id);
      if (!pm) return m.role === 1; // System Admin
      return pm.role === 1 || pm.role === 2 || m.role === 1;
    });
    return list.length > 0 ? list : members;
  }, [members, projectMembers]);

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
      setAssignerId(task.assignerId || task.createdById || '');
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
      setAssignerId('');
      setSelectedLabelIds([]);
      setCommentsCount(0);
      setAttachmentsCount(0);
      setActivitiesCount(0);
    }
    setTitleError('');
    setNoChangeNotice('');
    setIsSelectingLabels(false);
  }, [task, initialStatus, isOpen]);

  const [titleError, setTitleError] = useState('');
  const [noChangeNotice, setNoChangeNotice] = useState('');

  if (!isOpen) return null;

  const isEditing = !!task;

  // Tính toán quyền và trạng thái xin gia hạn
  const pendingExtension = task?.extensionRequests?.find((e) => e.status === 0);
  const isAssignee = !!(isEditing && task?.assigneeId && currentUserId && task.assigneeId === currentUserId);
  const isAssigner = !!(isEditing && task?.assignerId && currentUserId && task.assignerId === currentUserId);
  const isAdminOrLead = userRole === 1 || userRole === 2;
  const canReviewExtension = isAssigner || isAdminOrLead;
  // Chỉ Người được giao thực hiện công việc (Assignee) mới có quyền bấm nút Xin gia hạn
  const canRequestExtension = isAssignee && task?.status !== TaskStatus.DONE && !pendingExtension;

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim()) {
      setTitleError('Vui lòng nhập tiêu đề công việc');
      return;
    }
    if (title.trim().length < 2) {
      setTitleError('Tiêu đề công việc phải có ít nhất 2 ký tự');
      return;
    }
    setTitleError('');

    if (isEditing && task) {
      const originalDueDate = task.dueDate ? task.dueDate.split('T')[0] : '';
      const originalAssigneeId = task.assigneeId || '';
      const originalAssignerId = task.assignerId || '';
      const originalLabelIds = (task.labels || []).map((l) => l.id).sort().join(',');
      const currentLabelIds = [...selectedLabelIds].sort().join(',');

      const hasTitleChanged = title.trim() !== task.title;
      const hasDescChanged = (description.trim() || '') !== (task.description || '');
      const hasStatusChanged = status !== task.status;
      const hasPriorityChanged = priority !== task.priority;
      const hasDueDateChanged = (dueDate || '') !== originalDueDate;
      const hasAssigneeChanged = (assigneeId || '') !== originalAssigneeId;
      const hasAssignerChanged = (assignerId || '') !== originalAssignerId;
      const hasLabelsChanged = originalLabelIds !== currentLabelIds;

      // Nếu không có bất kỳ thay đổi nào -> báo validate chưa có thay đổi
      if (
        !hasTitleChanged &&
        !hasDescChanged &&
        !hasStatusChanged &&
        !hasPriorityChanged &&
        !hasDueDateChanged &&
        !hasAssigneeChanged &&
        !hasAssignerChanged &&
        !hasLabelsChanged
      ) {
        setNoChangeNotice('Chưa có thông tin nào thay đổi');
        return;
      }
      setNoChangeNotice('');

      setIsLoading(true);
      try {
        await onUpdateTask(task.id, {
          title: title.trim(),
          description: description.trim() || undefined,
          status,
          priority,
          dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
          assigneeId: assigneeId ? Number(assigneeId) : null,
          assignerId: assignerId ? Number(assignerId) : null,
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
          assignerId: assignerId ? Number(assignerId) : undefined,
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
                onClick={() => setIsConfirmDeleteOpen(true)}
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
            {/* Warning when clicking save with no changes made */}
            {noChangeNotice && (
              <div
                style={{
                  padding: '0.65rem 0.875rem',
                  backgroundColor: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  borderRadius: 'var(--radius-md)',
                  color: '#b45309',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  animation: 'fadeIn 0.2s ease-in-out',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Icon name="alert-circle" size={16} />
                  <span>{noChangeNotice}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setNoChangeNotice('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b45309', padding: '0 0.2rem' }}
                >
                  <Icon name="x" size={14} />
                </button>
              </div>
            )}

            {/* Title */}
            <div className="form-group" style={{ margin: 0 }}>
              <input
                type="text"
                className="form-input"
                placeholder="Tiêu đề công việc (Bắt buộc)..."
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (titleError) setTitleError('');
                }}
                disabled={isLoading}
                style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  backgroundColor: 'var(--bg-surface)',
                  padding: '0.625rem 0.875rem',
                  borderColor: titleError ? 'var(--priority-high)' : undefined,
                  boxShadow: titleError ? '0 0 0 3px rgba(239, 68, 68, 0.15)' : undefined,
                }}
              />
              {titleError && (
                <div
                  style={{
                    color: 'var(--priority-high)',
                    fontSize: '0.78125rem',
                    fontWeight: 600,
                    marginTop: '0.35rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <Icon name="alert-circle" size={14} />
                  <span>{titleError}</span>
                </div>
              )}
            </div>

            {/* Notification Banner for Rework or Rejected tasks */}
            {isEditing && task?.status === TaskStatus.TODO && task?.activities?.some((a) => a.action.toLowerCase().includes('làm lại')) && (
              <div
                style={{
                  marginBottom: '1rem',
                  padding: '0.65rem 0.875rem',
                  backgroundColor: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  borderRadius: 'var(--radius-md)',
                  color: '#b45309',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>⚠️</span>
                <span>
                  Công việc này được Admin yêu cầu làm lại. Hãy xem góp ý chi tiết tại tab <strong>Bình luận</strong> hoặc <strong>Lịch sử hoạt động</strong>.
                </span>
              </div>
            )}

            {isEditing && task?.status === TaskStatus.REJECTED && (
              <div
                style={{
                  marginBottom: '1rem',
                  padding: '0.65rem 0.875rem',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  borderRadius: 'var(--radius-md)',
                  color: '#b91c1c',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>❌</span>
                <span>
                  Công việc này đã bị từ chối duyệt. Bạn có thể chỉnh sửa nội dung và bấm <strong>"Gửi lại yêu cầu duyệt"</strong>.
                </span>
              </div>
            )}

            {/* Notification Banner for Pending Extension Request */}
            {isEditing && pendingExtension && (
              <div
                style={{
                  marginBottom: '1rem',
                  padding: '0.85rem 1rem',
                  backgroundColor: 'rgba(245, 158, 11, 0.12)',
                  border: '1.5px solid rgba(245, 158, 11, 0.4)',
                  borderRadius: 'var(--radius-lg)',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.6rem',
                  boxShadow: '0 2px 8px rgba(245, 158, 11, 0.15)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700, color: '#b45309', fontSize: '0.875rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>⏳</span>
                    <span>YÊU CẦU XIN GIA HẠN DEADLINE (ĐANG CHỜ DUYỆT)</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Gửi bởi: <strong style={{ color: 'var(--text-primary)' }}>{pendingExtension.requestedBy?.fullName || pendingExtension.requestedBy?.username || 'Thành viên'}</strong>
                  </span>
                </div>

                <div style={{ fontSize: '0.8125rem', lineHeight: 1.6, backgroundColor: 'var(--bg-surface)', padding: '0.6rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                  <div>
                    📅 <strong>Hạn chót mới đề xuất:</strong>{' '}
                    <span style={{ color: '#d97706', fontWeight: 700, fontSize: '0.9rem' }}>
                      {pendingExtension.newDueDate.split('T')[0]}
                    </span>{' '}
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      (Hạn cũ: {pendingExtension.oldDueDate ? pendingExtension.oldDueDate.split('T')[0] : 'Chưa có'})
                    </span>
                  </div>
                  <div style={{ marginTop: '0.25rem' }}>
                    📝 <strong>Lý do xin gia hạn:</strong> <em style={{ color: 'var(--text-secondary)' }}>"{pendingExtension.reason}"</em>
                  </div>
                </div>

                {canReviewExtension && onReviewExtension && task && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.15rem' }}>
                    <Button
                      variant="success"
                      size="sm"
                      icon="check"
                      isLoading={isLoading}
                      onClick={async () => {
                        setIsLoading(true);
                        try {
                          await onReviewExtension(task.id, pendingExtension.id, 1);
                        } finally {
                          setIsLoading(false);
                        }
                      }}
                    >
                      Chấp thuận gia hạn
                    </Button>

                    <Button
                      variant="danger"
                      size="sm"
                      icon="x"
                      isLoading={isLoading}
                      onClick={async () => {
                        const note = window.prompt('Nhập lý do từ chối gia hạn (Tùy chọn):');
                        if (note === null) return;
                        setIsLoading(true);
                        try {
                          await onReviewExtension(task.id, pendingExtension.id, 2, note);
                        } finally {
                          setIsLoading(false);
                        }
                      }}
                    >
                      Từ chối
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Quick Status Action Banner based on Role */}
            {isEditing && task && onUpdateStatus && userRole !== undefined && (
              <div
                style={{
                  marginBottom: '1rem',
                  padding: '0.75rem 1rem',
                  background: 'var(--bg-surface-secondary)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  ⚡ Thao tác duyệt & chuyển trạng thái ({userRole === 1 ? 'Quản trị viên / Admin' : 'Thành viên / Member'}):
                </div>
                <TaskStatusActions
                  task={{ ...task, status }}
                  userRole={userRole}
                  onUpdateStatus={async (newStatus, note) => {
                    if (task && onUpdateStatus) {
                      await onUpdateStatus(task.id, newStatus, note);
                    }
                    setStatus(newStatus);
                  }}
                  isLoading={isLoading}
                />
              </div>
            )}

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
                  <option value={0}>Chờ duyệt</option>
                  <option value={1}>Cần làm</option>
                  <option value={2}>Đang làm</option>
                  <option value={3}>Chờ nghiệm thu</option>
                  <option value={4}>Hoàn thành</option>
                  <option value={5}>Bị từ chối</option>
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
                  <option value={3}>Cao</option>
                  <option value={2}>Trung bình</option>
                  <option value={1}>Thấp</option>
                </select>
              </div>

              {/* Người giao việc (Chỉ hiển thị Cấp trên: Admin & Trưởng nhóm Lead) */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem', color: 'var(--text-muted)' }}>
                  Người giao việc
                </label>
                <select
                  className="form-select"
                  value={assignerId}
                  onChange={(e) => setAssignerId(e.target.value ? Number(e.target.value) : '')}
                  disabled={isLoading}
                  style={{ fontSize: '0.8125rem', padding: '0.45rem 0.65rem' }}
                >
                  <option value="">-- Cấp trên chỉ định --</option>
                  {assignerCandidates.map((m) => {
                    const pm = projectMembers?.find((p) => p.userId === m.id);
                    const roleName = pm?.role === 1 || m.role === 1 ? 'Admin' : 'Trưởng nhóm';
                    return (
                      <option key={m.id} value={m.id}>
                        {m.fullName} ({roleName})
                      </option>
                    );
                  })}
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem', margin: 0, color: 'var(--text-muted)' }}>
                    Hạn chót
                  </label>
                  {canRequestExtension && (
                    <button
                      type="button"
                      onClick={() => {
                        setExtensionNewDueDate('');
                        setExtensionReason('');
                        setExtensionError('');
                        setIsExtensionModalOpen(true);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#d97706',
                        fontSize: '0.725rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.2rem',
                        textDecoration: 'underline',
                      }}
                    >
                      <Icon name="clock" size={12} />
                      <span>Xin gia hạn</span>
                    </button>
                  )}
                </div>
                <input
                  type="date"
                  className="form-input"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  disabled={isLoading || (isAssignee && !canReviewExtension && task?.assigneeId !== task?.assignerId)}
                  style={{
                    fontSize: '0.8125rem',
                    padding: '0.45rem 0.65rem',
                    cursor: (isAssignee && !canReviewExtension && task?.assigneeId !== task?.assignerId) ? 'not-allowed' : 'pointer',
                    opacity: (isAssignee && !canReviewExtension && task?.assigneeId !== task?.assignerId) ? 0.8 : 1,
                  }}
                  title={(isAssignee && !canReviewExtension && task?.assigneeId !== task?.assignerId) ? 'Người thực hiện không thể tự ý sửa trực tiếp hạn chót. Hãy bấm "Xin gia hạn" ở trên!' : undefined}
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

      {isEditing && task && (
        <ConfirmModal
          isOpen={isConfirmDeleteOpen}
          onClose={() => setIsConfirmDeleteOpen(false)}
          onConfirm={async () => {
            await onDeleteTask(task.id);
            onClose();
          }}
          title="Xóa công việc"
          message={`Bạn có chắc chắn muốn xóa công việc #${task.id} "${task.title}"? Hành động này không thể hoàn tác.`}
          confirmText="Xóa công việc"
        />
      )}

      {/* Modal Xin gia hạn Deadline */}
      {isExtensionModalOpen && task && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '1rem',
          }}
          onClick={() => {
            if (!isSubmittingExtension) setIsExtensionModalOpen(false);
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-color)',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
              width: '100%',
              maxWidth: '480px',
              padding: '1.5rem',
              animation: 'modalSlideUp 0.2s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.25rem' }}>⏰</span>
                <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Xin gia hạn Deadline
                </h3>
              </div>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ padding: '0.25rem', color: 'var(--text-muted)' }}
                onClick={() => setIsExtensionModalOpen(false)}
                disabled={isSubmittingExtension}
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
              Gửi đề xuất gia hạn thời gian hoàn thành công việc <strong>"{task.title}"</strong> đến Người giao việc / Quản trị viên.
            </p>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!extensionNewDueDate) {
                  setExtensionError('Vui lòng chọn hạn chót mới');
                  return;
                }
                if (task.dueDate) {
                  const oldD = new Date(task.dueDate).setHours(0, 0, 0, 0);
                  const newD = new Date(extensionNewDueDate).setHours(0, 0, 0, 0);
                  if (newD <= oldD) {
                    setExtensionError('Hạn chót mới phải sau hạn chót hiện tại');
                    return;
                  }
                }
                if (!extensionReason.trim() || extensionReason.trim().length < 5) {
                  setExtensionError('Lý do xin gia hạn phải có ít nhất 5 ký tự');
                  return;
                }
                setExtensionError('');
                setIsSubmittingExtension(true);
                try {
                  if (onRequestExtension) {
                    await onRequestExtension(task.id, extensionNewDueDate, extensionReason.trim());
                  }
                  setIsExtensionModalOpen(false);
                } catch (err) {
                  const msg = err instanceof Error ? err.message : 'Gửi yêu cầu thất bại';
                  setExtensionError(msg);
                } finally {
                  setIsSubmittingExtension(false);
                }
              }}
            >
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Hạn chót đề xuất mới <span style={{ color: 'var(--priority-high)' }}>*</span>
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={extensionNewDueDate}
                  onChange={(e) => {
                    setExtensionNewDueDate(e.target.value);
                    if (extensionError) setExtensionError('');
                  }}
                  disabled={isSubmittingExtension}
                  required
                  style={{ fontSize: '0.875rem' }}
                />
                {task.dueDate && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                    (Hạn chót hiện tại: {task.dueDate.split('T')[0]})
                  </span>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Lý do xin gia hạn <span style={{ color: 'var(--priority-high)' }}>*</span>
                </label>
                <textarea
                  className="form-textarea"
                  placeholder="Nêu rõ lý do cần thêm thời gian (khối lượng phát sinh, gặp vấn đề kỹ thuật, chờ phản hồi khách hàng...)..."
                  value={extensionReason}
                  onChange={(e) => {
                    setExtensionReason(e.target.value);
                    if (extensionError) setExtensionError('');
                  }}
                  disabled={isSubmittingExtension}
                  rows={3}
                  required
                  style={{ fontSize: '0.875rem', resize: 'vertical' }}
                />
              </div>

              {extensionError && (
                <div
                  style={{
                    padding: '0.5rem 0.75rem',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--priority-high)',
                    fontSize: '0.8125rem',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <Icon name="alert-circle" size={14} />
                  <span>{extensionError}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsExtensionModalOpen(false)}
                  disabled={isSubmittingExtension}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  icon="check"
                  isLoading={isSubmittingExtension}
                >
                  Gửi yêu cầu gia hạn
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
