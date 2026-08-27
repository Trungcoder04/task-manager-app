import React, { useState, useMemo, useEffect } from 'react';
import { Task, TaskStatusType, TaskPriorityType } from '../../types/task.types';
import { Avatar } from '../common/Avatar';
import { Button } from '../common/Button';
import { Icon } from '../common/Icon';
import { ConfirmModal } from '../common/ConfirmModal';

interface TaskListProps {
  tasks: Task[];
  currentUserId?: number;
  onSelectTask: (task: Task) => void;
  onMoveTask: (taskId: number, newStatus: TaskStatusType) => void;
  onDeleteTask: (taskId: number) => Promise<void>;
  onRequestExtension?: (taskId: number, newDueDate: string, reason: string) => Promise<any>;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  currentUserId,
  onSelectTask,
  onMoveTask,
  onDeleteTask,
  onRequestExtension,
}) => {
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  // 📄 State phân trang
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // 🔘 State Checkbox chọn task
  const [selectedTaskIds, setSelectedTaskIds] = useState<number[]>([]);

  // ⏰ State Modal Không gian xin gia hạn (Extension Queue Workspace)
  const [isExtensionModalOpen, setIsExtensionModalOpen] = useState(false);
  const [activeEditingTask, setActiveEditingTask] = useState<Task | null>(null);
  const [submittedTaskIds, setSubmittedTaskIds] = useState<Record<number, { newDueDate: string; reason: string }>>({});
  const [extensionNewDueDate, setExtensionNewDueDate] = useState('');
  const [extensionReason, setExtensionReason] = useState('');
  const [extensionError, setExtensionError] = useState('');
  const [isSubmittingExtension, setIsSubmittingExtension] = useState(false);

  // Tự động điều chỉnh trang nếu số lượng task thay đổi
  const totalPages = Math.ceil(tasks.length / pageSize) || 1;

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [tasks.length, pageSize, totalPages, currentPage]);

  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return tasks.slice(start, start + pageSize);
  }, [tasks, currentPage, pageSize]);

  const startIndex = tasks.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, tasks.length);

  // Định dạng ngày hiển thị dd/mm/yyyy
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Chưa có hạn';
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Kiểm tra công việc quá hạn
  const isOverdue = (dateStr?: string, status?: number) => {
    if (!dateStr || status === 4) return false;
    return new Date(dateStr).getTime() < new Date().getTime();
  };

  // Badge độ ưu tiên
  const getPriorityBadge = (priority: TaskPriorityType) => {
    switch (priority) {
      case 3:
        return { label: 'Cao', bg: 'rgba(239, 68, 68, 0.12)', color: '#dc2626' };
      case 2:
        return { label: 'Trung bình', bg: 'rgba(245, 158, 11, 0.12)', color: '#d97706' };
      case 1:
      default:
        return { label: 'Thấp', bg: 'rgba(59, 130, 246, 0.12)', color: '#2563eb' };
    }
  };

  // Helper check xem task có đủ điều kiện xin gia hạn không:
  // 1. Phải là Người thực hiện (Assignee === currentUserId)
  // 2. Task chưa Hoàn thành (status !== 4)
  // 3. Task chưa có yêu cầu gia hạn nào đang chờ duyệt (status === 0)
  const isEligibleForExtension = (task: Task) => {
    const hasPending = task.extensionRequests?.some((e) => e.status === 0);
    const isAssignee = !!(task.assigneeId && currentUserId && task.assigneeId === currentUserId);
    return isAssignee && task.status !== 4 && !hasPending;
  };

  // Danh sách các task được chọn đủ điều kiện xin gia hạn
  const eligibleSelectedTasks = useMemo(() => {
    return tasks.filter((t) => selectedTaskIds.includes(t.id) && isEligibleForExtension(t));
  }, [tasks, selectedTaskIds, currentUserId]);

  // Xử lý chọn / bỏ chọn từng task
  const handleToggleSelect = (taskId: number) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  // Xử lý chọn / bỏ chọn tất cả trên trang hiện tại
  const isAllPaginatedSelected =
    paginatedTasks.length > 0 && paginatedTasks.every((t) => selectedTaskIds.includes(t.id));

  const handleToggleSelectAllPaginated = () => {
    if (isAllPaginatedSelected) {
      const paginatedIds = paginatedTasks.map((t) => t.id);
      setSelectedTaskIds((prev) => prev.filter((id) => !paginatedIds.includes(id)));
    } else {
      const paginatedIds = paginatedTasks.map((t) => t.id);
      setSelectedTaskIds((prev) => Array.from(new Set([...prev, ...paginatedIds])));
    }
  };

  // Mở modal Xin gia hạn
  const handleOpenExtensionModal = () => {
    if (eligibleSelectedTasks.length === 0) return;
    setExtensionError('');
    setExtensionNewDueDate('');
    setExtensionReason('');
    setSubmittedTaskIds({});
    
    // Nếu chỉ có đúng 1 task -> mở trực tiếp form của task đó
    if (eligibleSelectedTasks.length === 1) {
      setActiveEditingTask(eligibleSelectedTasks[0]);
    } else {
      // Nếu có nhiều task -> mở danh sách workspace để chọn từng việc
      setActiveEditingTask(null);
    }
    setIsExtensionModalOpen(true);
  };

  // Mở form nhập gia hạn cho 1 task cụ thể trong danh sách
  const handleSelectTaskToExtend = (task: Task) => {
    setActiveEditingTask(task);
    setExtensionNewDueDate('');
    setExtensionReason('');
    setExtensionError('');
  };

  // Gửi yêu cầu gia hạn cho task đang chọn
  const handleSubmitTaskExtension = async () => {
    if (!activeEditingTask) return;
    if (!extensionNewDueDate) {
      setExtensionError('Vui lòng chọn hạn chót đề xuất mới');
      return;
    }

    if (activeEditingTask.dueDate) {
      const oldTime = new Date(activeEditingTask.dueDate).setHours(0, 0, 0, 0);
      const newTime = new Date(extensionNewDueDate).setHours(0, 0, 0, 0);
      if (newTime <= oldTime) {
        setExtensionError('Hạn chót mới phải sau hạn chót hiện tại của công việc');
        return;
      }
    }

    if (!extensionReason.trim()) {
      setExtensionError('Vui lòng nhập lý do xin gia hạn');
      return;
    }

    if (!onRequestExtension) return;

    setIsSubmittingExtension(true);
    setExtensionError('');
    try {
      await onRequestExtension(activeEditingTask.id, extensionNewDueDate, extensionReason.trim());
      
      // Ghi nhận task này đã gửi thành công
      setSubmittedTaskIds((prev) => ({
        ...prev,
        [activeEditingTask.id]: { newDueDate: extensionNewDueDate, reason: extensionReason.trim() },
      }));

      // Nếu chỉ có 1 task -> đóng modal luôn
      if (eligibleSelectedTasks.length === 1) {
        setIsExtensionModalOpen(false);
        setSelectedTaskIds((prev) => prev.filter((id) => id !== activeEditingTask.id));
        setActiveEditingTask(null);
      } else {
        // Nếu có nhiều task -> quay lại danh sách để người dùng chọn tiếp các việc còn lại
        setActiveEditingTask(null);
      }
    } catch (err: any) {
      setExtensionError(err?.message || 'Không thể gửi yêu cầu gia hạn. Vui lòng thử lại.');
    } finally {
      setIsSubmittingExtension(false);
    }
  };

  // Đóng modal hoàn tất
  const handleCloseExtensionModal = () => {
    setIsExtensionModalOpen(false);
    setActiveEditingTask(null);
    // Bỏ chọn các task đã gửi thành công
    const submittedIds = Object.keys(submittedTaskIds).map(Number);
    if (submittedIds.length > 0) {
      setSelectedTaskIds((prev) => prev.filter((id) => !submittedIds.includes(id)));
    }
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.04)',
        marginTop: '0.25rem',
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: 0,
      }}
    >
      {/* 🔘 Thanh thao tác hàng loạt khi có checkbox được chọn */}
      {selectedTaskIds.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            padding: '0.65rem 1.25rem',
            backgroundColor: 'rgba(99, 102, 241, 0.08)',
            borderBottom: '1px solid rgba(99, 102, 241, 0.2)',
            animation: 'fadeIn 0.2s ease-in-out',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.85rem' }}>
            <Icon name="check" size={16} color="var(--primary-600)" />
            <span>
              Đã chọn <strong style={{ color: 'var(--primary-600)' }}>{selectedTaskIds.length}</strong> công việc
            </span>
            {eligibleSelectedTasks.length > 0 ? (
              <span
                style={{
                  fontSize: '0.75rem',
                  color: '#b45309',
                  fontWeight: 700,
                  backgroundColor: 'rgba(245, 158, 11, 0.18)',
                  padding: '0.15rem 0.55rem',
                  borderRadius: '999px',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                }}
              >
                {eligibleSelectedTasks.length} việc đủ điều kiện xin gia hạn
              </span>
            ) : (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                (Không có công việc nào do bạn thực hiện đủ điều kiện xin gia hạn)
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {eligibleSelectedTasks.length > 0 && onRequestExtension && (
              <button
                type="button"
                onClick={handleOpenExtensionModal}
                style={{
                  backgroundColor: '#d97706',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  boxShadow: '0 2px 6px rgba(217, 119, 6, 0.3)',
                  transition: 'all 0.2s ease',
                }}
              >
                <Icon name="clock" size={14} color="#ffffff" />
                <span>Xin gia hạn ({eligibleSelectedTasks.length})</span>
              </button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedTaskIds([])}
              style={{ fontSize: '0.8rem' }}
            >
              Bỏ chọn
            </Button>
          </div>
        </div>
      )}

      {/* 🔄 Khu vực cuộn riêng cho Bảng dữ liệu (Không cuộn cả trang) */}
      <div
        style={{
          overflowX: 'auto',
          overflowY: 'auto',
          flex: 1,
          minHeight: '220px',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 3,
              backgroundColor: 'var(--bg-surface-secondary)',
            }}
          >
            <tr
              style={{
                borderBottom: '1px solid var(--border-color)',
                color: 'var(--text-muted)',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              {/* Checkbox Header (Chọn tất cả trên trang) */}
              <th style={{ width: '48px', padding: '1.1rem 0.75rem 1.1rem 1.25rem', textAlign: 'center' }}>
                <input
                  type="checkbox"
                  checked={isAllPaginatedSelected}
                  onChange={handleToggleSelectAllPaginated}
                  style={{
                    cursor: 'pointer',
                    width: '16px',
                    height: '16px',
                    accentColor: 'var(--primary-600)',
                  }}
                  title="Chọn tất cả trên trang này"
                />
              </th>
              <th style={{ padding: '1.1rem 1.25rem', fontWeight: 700 }}>Công việc</th>
              <th style={{ padding: '1.1rem 1.25rem', fontWeight: 700 }}>Trạng thái</th>
              <th style={{ padding: '1.1rem 1.25rem', fontWeight: 700 }}>Độ ưu tiên</th>
              <th style={{ padding: '1.1rem 1.25rem', fontWeight: 700 }}>Người giao việc</th>
              <th style={{ padding: '1.1rem 1.25rem', fontWeight: 700 }}>Người thực hiện</th>
              <th style={{ padding: '1.1rem 1.25rem', fontWeight: 700 }}>Hạn hoàn thành</th>
              <th style={{ padding: '1.1rem 1.25rem', fontWeight: 700, textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {paginatedTasks.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)' }}>
                    <Icon name="search" size={40} />
                    <p style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>Không tìm thấy công việc phù hợp</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedTasks.map((task) => {
                const priorityInfo = getPriorityBadge(task.priority);
                const overdue = isOverdue(task.dueDate, task.status);
                const hasPendingExtension = task.extensionRequests?.some((e) => e.status === 0);
                const eligible = isEligibleForExtension(task);
                const isChecked = selectedTaskIds.includes(task.id);

                return (
                  <tr
                    key={task.id}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      backgroundColor: isChecked ? 'rgba(99, 102, 241, 0.04)' : 'transparent',
                      transition: 'all var(--transition-fast)',
                    }}
                    onMouseEnter={(e) => {
                      if (!isChecked) e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.03)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isChecked) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    {/* Cột Checkbox */}
                    <td
                      style={{ width: '48px', padding: '1.1rem 0.75rem 1.1rem 1.25rem', textAlign: 'center' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleSelect(task.id)}
                        style={{
                          cursor: 'pointer',
                          width: '16px',
                          height: '16px',
                          accentColor: 'var(--primary-600)',
                        }}
                        title={eligible ? 'Tích chọn để xin gia hạn' : undefined}
                      />
                    </td>

                    {/* Cột 1: Tên công việc & Labels */}
                    <td style={{ padding: '1.1rem 1.25rem', cursor: 'pointer' }} onClick={() => onSelectTask(task)}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.925rem' }}>
                            {task.title}
                          </span>
                          {hasPendingExtension && (
                            <span
                              style={{
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                                color: '#b45309',
                                border: '1px solid rgba(245, 158, 11, 0.4)',
                                borderRadius: '4px',
                                padding: '0.1rem 0.45rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                              }}
                              title="Đang có yêu cầu xin gia hạn deadline chờ duyệt"
                            >
                              ⏳ Xin gia hạn
                            </span>
                          )}
                        </div>
                        {task.labels && task.labels.length > 0 && (
                          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
                            {task.labels.slice(0, 3).map((lbl) => (
                              <span
                                key={lbl.id}
                                style={{
                                  backgroundColor: `${lbl.colorCode}1f` || 'rgba(99, 102, 241, 0.12)',
                                  color: lbl.colorCode || '#6366f1',
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  padding: '0.15rem 0.5rem',
                                  borderRadius: 'var(--radius-sm)',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {lbl.name}
                              </span>
                            ))}
                            {task.labels.length > 3 && (
                              <span
                                style={{
                                  backgroundColor: 'var(--bg-surface-secondary)',
                                  color: 'var(--text-muted)',
                                  fontSize: '0.65rem',
                                  fontWeight: 700,
                                  padding: '0.12rem 0.4rem',
                                  borderRadius: 'var(--radius-sm)',
                                  border: '1px solid var(--border-color)',
                                  whiteSpace: 'nowrap',
                                  cursor: 'default',
                                }}
                                title={`Còn ${task.labels.length - 3} nhãn khác: ${task.labels.slice(3).map((l) => l.name).join(', ')}`}
                              >
                                +{task.labels.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Cột 2: Trạng thái (Dropdown gọn gàng) */}
                    <td style={{ padding: '1.1rem 1.25rem' }}>
                      <select
                        value={task.status}
                        onChange={(e) => onMoveTask(task.id, Number(e.target.value) as TaskStatusType)}
                        style={{
                          padding: '0.35rem 0.75rem',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          borderRadius: '999px',
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'var(--bg-surface)',
                          color: 'var(--text-primary)',
                          cursor: 'pointer',
                          outline: 'none',
                        }}
                      >
                        <option value={0}>Chờ duyệt</option>
                        <option value={1}>Cần làm</option>
                        <option value={2}>Đang làm</option>
                        <option value={3}>Chờ nghiệm thu</option>
                        <option value={4}>Hoàn thành</option>
                        <option value={5}>Bị từ chối</option>
                      </select>
                    </td>

                    {/* Cột 3: Độ ưu tiên */}
                    <td style={{ padding: '1.1rem 1.25rem' }}>
                      <span
                        style={{
                          backgroundColor: priorityInfo.bg,
                          color: priorityInfo.color,
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          padding: '0.25rem 0.65rem',
                          borderRadius: '999px',
                          display: 'inline-block',
                        }}
                      >
                        {priorityInfo.label}
                      </span>
                    </td>

                    {/* Cột 4: Người giao việc */}
                    <td style={{ padding: '1.1rem 1.25rem' }}>
                      {task.assigner || task.createdBy ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <Avatar name={(task.assigner?.fullName || task.assigner?.username || task.createdBy?.fullName || task.createdBy?.username)!} src={task.assigner?.avatar || task.assigner?.avatarUrl || task.createdBy?.avatar || task.createdBy?.avatarUrl} size="sm" />
                          <span style={{ fontSize: '0.845rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {task.assigner?.fullName || task.assigner?.username || task.createdBy?.fullName || task.createdBy?.username}
                          </span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Tự động</span>
                      )}
                    </td>

                    {/* Cột 5: Người thực hiện */}
                    <td style={{ padding: '1.1rem 1.25rem' }}>
                      {task.assignee ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <Avatar name={task.assignee.fullName || task.assignee.username} src={task.assignee.avatar || task.assignee.avatarUrl} size="sm" />
                          <span style={{ fontSize: '0.845rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {task.assignee.fullName || task.assignee.username}
                          </span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Chưa phân công</span>
                      )}
                    </td>

                    {/* Cột 6: Hạn hoàn thành */}
                    <td style={{ padding: '1.1rem 1.25rem' }}>
                      <span
                        style={{
                          fontSize: '0.845rem',
                          fontWeight: overdue ? 700 : 500,
                          color: overdue ? '#dc2626' : 'var(--text-secondary)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                        }}
                      >
                        <Icon name="clock" size={14} color={overdue ? '#dc2626' : 'var(--text-muted)'} />
                        {formatDate(task.dueDate)}
                        {overdue && <span style={{ fontSize: '0.7rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#dc2626', padding: '0.1rem 0.4rem', borderRadius: 'var(--radius-sm)' }}>Quá hạn</span>}
                      </span>
                    </td>

                    {/* Cột 7: Thao tác (Sửa / Xóa) */}
                    <td style={{ padding: '1.1rem 1.25rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <Button variant="secondary" size="icon" icon="edit" onClick={() => onSelectTask(task)} title="Chỉnh sửa công việc" />
                        <Button variant="danger" size="icon" icon="trash" onClick={() => setDeletingTask(task)} title="Xóa công việc" />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 📄 Thanh Phân Trang (Pagination Footer Bar) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
          padding: '0.85rem 1.5rem',
          borderTop: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-surface-secondary)',
          fontSize: '0.875rem',
          color: 'var(--text-secondary)',
        }}
      >
        {/* Thông tin dòng */}
        <div>
          Hiển thị <strong style={{ color: 'var(--text-primary)' }}>{startIndex}</strong> - <strong style={{ color: 'var(--text-primary)' }}>{endIndex}</strong> trong tổng số <strong style={{ color: 'var(--primary-600)' }}>{tasks.length}</strong> công việc
        </div>

        {/* Cụm điều khiển phân trang */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {/* Số dòng mỗi trang */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
            <span style={{ fontSize: '0.8125rem', whiteSpace: 'nowrap', flexShrink: 0 }}>Mỗi trang:</span>
            <select
              className="form-input"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              style={{
                height: '32px',
                padding: '0 0.5rem',
                fontSize: '0.8125rem',
                borderRadius: 'var(--radius-md)',
                fontWeight: 600,
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <option value={5}>5 dòng</option>
              <option value={10}>10 dòng</option>
              <option value={20}>20 dòng</option>
              <option value={50}>50 dòng</option>
            </select>
          </div>

          {/* Nút chuyển trang */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Button
              variant="secondary"
              size="sm"
              icon="chevron-left"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              title="Trang trước"
              style={{ padding: '0.3rem 0.6rem' }}
            >
              Trước
            </Button>

            <span style={{ fontSize: '0.8125rem', fontWeight: 600, padding: '0 0.4rem' }}>
              Trang <strong style={{ color: 'var(--primary-600)' }}>{currentPage}</strong> / {totalPages}
            </span>

            <Button
              variant="secondary"
              size="sm"
              icon="chevron-right"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              title="Trang sau"
              style={{ padding: '0.3rem 0.6rem' }}
            >
              Sau
            </Button>
          </div>
        </div>
      </div>

      {/* ⏰ Modal Không gian xin gia hạn deadline (Extension Queue Workspace) */}
      {isExtensionModalOpen && (
        <div className="modal-backdrop" style={{ zIndex: 1050 }}>
          <div
            className="modal-content"
            style={{
              maxWidth: activeEditingTask ? '520px' : '620px',
              width: '94%',
              padding: '1.5rem',
              borderRadius: 'var(--radius-xl)',
              backgroundColor: 'var(--bg-surface)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.1rem',
              animation: 'fadeIn 0.2s ease-in-out',
            }}
          >
            {/* VIEW 1: Danh sách các công việc đủ điều kiện gia hạn (Queue List View) */}
            {!activeEditingTask ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#b45309' }}>
                    <Icon name="clock" size={22} />
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Danh sách xin gia hạn deadline
                      </h3>
                      <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Đã gửi yêu cầu: <strong style={{ color: '#059669' }}>{Object.keys(submittedTaskIds).length}</strong> / {eligibleSelectedTasks.length} công việc
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost btn-icon"
                    onClick={handleCloseExtensionModal}
                  >
                    <Icon name="x" size={18} />
                  </button>
                </div>

                <div
                  style={{
                    maxHeight: '360px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.65rem',
                    paddingRight: '0.25rem',
                  }}
                >
                  {eligibleSelectedTasks.map((task) => {
                    const isSubmitted = !!submittedTaskIds[task.id];
                    const priorityInfo = getPriorityBadge(task.priority);

                    return (
                      <div
                        key={task.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.75rem',
                          padding: '0.85rem 1rem',
                          backgroundColor: isSubmitted ? 'rgba(16, 185, 129, 0.06)' : 'var(--bg-surface-secondary)',
                          borderRadius: 'var(--radius-lg)',
                          border: `1px solid ${isSubmitted ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-color)'}`,
                          transition: 'all var(--transition-fast)',
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                              {task.title}
                            </span>
                            <span
                              style={{
                                backgroundColor: priorityInfo.bg,
                                color: priorityInfo.color,
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                padding: '0.1rem 0.45rem',
                                borderRadius: '999px',
                              }}
                            >
                              {priorityInfo.label}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Icon name="clock" size={13} />
                            <span>Hạn hiện tại: <strong>{formatDate(task.dueDate)}</strong></span>
                          </div>
                        </div>

                        {/* Cột thao tác */}
                        <div>
                          {isSubmitted ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem' }}>
                              <span
                                style={{
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  color: '#059669',
                                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                                  padding: '0.25rem 0.6rem',
                                  borderRadius: '999px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                }}
                              >
                                ✅ Đã gửi yêu cầu
                              </span>
                              <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 600 }}>
                                Hạn mới: {formatDate(submittedTaskIds[task.id].newDueDate)}
                              </span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSelectTaskToExtend(task)}
                              style={{
                                backgroundColor: '#d97706',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: 'var(--radius-md)',
                                padding: '0.4rem 0.85rem',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                boxShadow: '0 2px 6px rgba(217, 119, 6, 0.25)',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              <Icon name="clock" size={13} color="#ffffff" />
                              <span>Gia hạn việc này</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer Modal Danh sách */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Bấm "Gia hạn việc này" để tùy chỉnh ngày và lý do cho từng việc.
                  </span>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleCloseExtensionModal}
                    style={{ minWidth: '100px' }}
                  >
                    Hoàn tất
                  </Button>
                </div>
              </>
            ) : (
              /* VIEW 2: Form nhập hạn chót và lý do cho 1 task cụ thể (Form View) */
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {eligibleSelectedTasks.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => setActiveEditingTask(null)}
                        disabled={isSubmittingExtension}
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        <Icon name="chevron-left" size={16} />
                        <span>Quay lại</span>
                      </button>
                    )}
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Xin gia hạn: <span style={{ color: '#d97706' }}>{activeEditingTask.title}</span>
                    </h3>
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost btn-icon"
                    onClick={handleCloseExtensionModal}
                    disabled={isSubmittingExtension}
                  >
                    <Icon name="x" size={18} />
                  </button>
                </div>

                {/* Thông tin task hiện tại */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-surface-secondary)',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.8125rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ color: 'var(--text-secondary)' }}>Hạn hoàn thành hiện tại:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{formatDate(activeEditingTask.dueDate)}</strong>
                </div>

                {extensionError && (
                  <div
                    style={{
                      color: 'var(--priority-high)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      padding: '0.5rem 0.75rem',
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    {extensionError}
                  </div>
                )}

                {/* Form inputs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem' }}>
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
                      style={{ fontSize: '0.85rem' }}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                      Lý do xin gia hạn <span style={{ color: 'var(--priority-high)' }}>*</span>
                    </label>
                    <textarea
                      className="form-input"
                      rows={3}
                      placeholder="Nêu rõ lý do cần thêm thời gian cho công việc này..."
                      value={extensionReason}
                      onChange={(e) => {
                        setExtensionReason(e.target.value);
                        if (extensionError) setExtensionError('');
                      }}
                      disabled={isSubmittingExtension}
                      style={{ fontSize: '0.85rem', resize: 'vertical' }}
                    />
                  </div>
                </div>

                {/* Modal Footer actions */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      if (eligibleSelectedTasks.length > 1) {
                        setActiveEditingTask(null);
                      } else {
                        handleCloseExtensionModal();
                      }
                    }}
                    disabled={isSubmittingExtension}
                  >
                    {eligibleSelectedTasks.length > 1 ? 'Quay lại' : 'Hủy bỏ'}
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    isLoading={isSubmittingExtension}
                    onClick={handleSubmitTaskExtension}
                    style={{ backgroundColor: '#d97706', borderColor: '#d97706' }}
                  >
                    Gửi yêu cầu gia hạn
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Confirm Modal khi bấm nút Xóa */}
      <ConfirmModal
        isOpen={deletingTask !== null}
        onClose={() => setDeletingTask(null)}
        onConfirm={async () => {
          if (deletingTask) {
            await onDeleteTask(deletingTask.id);
          }
        }}
        title="Xóa công việc"
        message={`Bạn có chắc chắn muốn xóa công việc "${deletingTask?.title}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa công việc"
      />
    </div>
  );
};


