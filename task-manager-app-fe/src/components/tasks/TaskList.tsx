import React, { useState, useMemo, useEffect } from 'react';
import { Task, TaskStatusType, TaskPriorityType } from '../../types/task.types';
import { Avatar } from '../common/Avatar';
import { Button } from '../common/Button';
import { Icon } from '../common/Icon';
import { ConfirmModal } from '../common/ConfirmModal';

interface TaskListProps {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onMoveTask: (taskId: number, newStatus: TaskStatusType) => void;
  onDeleteTask: (taskId: number) => Promise<void>;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  onSelectTask,
  onMoveTask,
  onDeleteTask,
}) => {
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  // 📄 State phân trang
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

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
                <td colSpan={7} style={{ padding: '4rem 2rem', textAlign: 'center' }}>
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

                return (
                  <tr
                    key={task.id}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      transition: 'all var(--transition-fast)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.03)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
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
                          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                            {task.labels.map((lbl) => (
                              <span
                                key={lbl.id}
                                style={{
                                  backgroundColor: `${lbl.colorCode}1f` || 'rgba(99, 102, 241, 0.12)',
                                  color: lbl.colorCode || '#6366f1',
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  padding: '0.15rem 0.5rem',
                                  borderRadius: 'var(--radius-sm)',
                                }}
                              >
                                {lbl.name}
                              </span>
                            ))}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem' }}>Mỗi trang:</span>
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
