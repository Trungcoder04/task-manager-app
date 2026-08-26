import React, { useState } from 'react';
import { Task, TaskStatus, TaskStatusType } from '../../types/task.types';
import { ProjectMemberRole, ProjectMemberRoleType } from '../../types/project.types';
import { Button } from '../common/Button';

interface TaskStatusActionsProps {
  task: Task;
  userRole: ProjectMemberRoleType; // 1: ADMIN, 2: MEMBER
  onUpdateStatus: (newStatus: TaskStatusType, note?: string) => Promise<void>;
  isLoading?: boolean;
}

export const TaskStatusActions: React.FC<TaskStatusActionsProps> = ({
  task,
  userRole,
  onUpdateStatus,
  isLoading = false,
}) => {
  const isAdmin = userRole === ProjectMemberRole.ADMIN;
  const [rejectNote, setRejectNote] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [showReworkInput, setShowReworkInput] = useState(false);

  const handleAction = async (status: TaskStatusType, note?: string) => {
    await onUpdateStatus(status, note);
    setShowRejectInput(false);
    setShowReworkInput(false);
    setRejectNote('');
  };

  return (
    <div className="task-status-actions" style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', width: '100%' }}>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* 1. TRẠNG THÁI: PENDING (Chờ duyệt) */}
        {task.status === TaskStatus.PENDING && (
          <>
            {isAdmin ? (
              <>
                <Button
                  variant="primary"
                  icon="check"
                  isLoading={isLoading}
                  onClick={() => handleAction(TaskStatus.TODO)}
                >
                  ⚡ Phê duyệt & Giao việc
                </Button>
                <Button
                  variant="danger"
                  icon="x"
                  isLoading={isLoading}
                  onClick={() => {
                    setShowRejectInput(!showRejectInput);
                    setShowReworkInput(false);
                  }}
                >
                  Từ chối duyệt
                </Button>
              </>
            ) : (
              <span className="badge badge-warning" style={{ padding: '0.4rem 0.8rem', borderRadius: '6px' }}>
                ⏳ Đang chờ Admin phê duyệt...
              </span>
            )}
          </>
        )}

        {/* 2. TRẠNG THÁI: TODO (Cần làm) */}
        {task.status === TaskStatus.TODO && (
          <Button
            variant="primary"
            icon="play"
            isLoading={isLoading}
            onClick={() => handleAction(TaskStatus.IN_PROGRESS)}
          >
            Bắt đầu làm (Start)
          </Button>
        )}

        {/* 3. TRẠNG THÁI: IN_PROGRESS (Đang làm) */}
        {task.status === TaskStatus.IN_PROGRESS && (
          <>
            <Button
              variant="primary"
              icon="send"
              isLoading={isLoading}
              onClick={() => handleAction(TaskStatus.IN_REVIEW)}
            >
              Gửi nghiệm thu (Submit Review)
            </Button>
            <Button
              variant="secondary"
              isLoading={isLoading}
              onClick={() => handleAction(TaskStatus.TODO)}
            >
              Tạm dừng
            </Button>
          </>
        )}

        {/* 4. TRẠNG THÁI: IN_REVIEW (Chờ nghiệm thu) */}
        {task.status === TaskStatus.IN_REVIEW && (
          <>
            {isAdmin ? (
              <>
                <Button
                  variant="success"
                  icon="check"
                  isLoading={isLoading}
                  onClick={() => handleAction(TaskStatus.DONE)}
                >
                  Nghiệm thu đạt (Hoàn thành)
                </Button>
                <Button
                  variant="danger"
                  icon="refresh"
                  isLoading={isLoading}
                  onClick={() => {
                    setShowReworkInput(!showReworkInput);
                    setShowRejectInput(false);
                  }}
                >
                  Yêu cầu làm lại (Về TODO)
                </Button>
              </>
            ) : (
              <span className="badge badge-purple" style={{ padding: '0.4rem 0.8rem', borderRadius: '6px' }}>
                Đang chờ Admin nghiệm thu sản phẩm...
              </span>
            )}
          </>
        )}

        {/* 5. TRẠNG THÁI: REJECTED (Bị từ chối) */}
        {task.status === TaskStatus.REJECTED && (
          <>
            <Button
              variant="secondary"
              icon="refresh"
              isLoading={isLoading}
              onClick={() => handleAction(TaskStatus.PENDING)}
            >
              Gửi lại yêu cầu duyệt (Resubmit)
            </Button>
            {isAdmin && (
              <Button
                variant="primary"
                isLoading={isLoading}
                onClick={() => handleAction(TaskStatus.TODO)}
              >
                Mở lại vào TODO
              </Button>
            )}
          </>
        )}

        {/* 6. TRẠNG THÁI: DONE (Hoàn thành) */}
        {task.status === TaskStatus.DONE && isAdmin && (
          <Button
            variant="secondary"
            size="sm"
            isLoading={isLoading}
            onClick={() => handleAction(TaskStatus.IN_PROGRESS)}
          >
            Mở lại công việc
          </Button>
        )}
      </div>

      {/* Hộp thoại nhập lý do Từ chối (PENDING -> REJECTED) */}
      {showRejectInput && (
        <div
          style={{
            padding: '0.75rem',
            background: 'var(--bg-surface)',
            border: '1px solid var(--priority-high)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--priority-high)' }}>
            ❌ Xác nhận từ chối Task:
          </label>
          <input
            type="text"
            className="form-input"
            placeholder="Nhập lý do từ chối (tùy chọn)..."
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAction(TaskStatus.REJECTED, rejectNote || 'Admin từ chối duyệt công việc');
              }
            }}
            style={{ fontSize: '0.8125rem' }}
            autoFocus
          />
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <Button variant="ghost" size="sm" onClick={() => setShowRejectInput(false)}>
              Hủy
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={isLoading}
              onClick={() => handleAction(TaskStatus.REJECTED, rejectNote || 'Admin từ chối duyệt công việc')}
            >
              Chuyển sang Từ chối
            </Button>
          </div>
        </div>
      )}

      {/* Hộp thoại nhập góp ý Yêu cầu làm lại (IN_REVIEW -> TODO) */}
      {showReworkInput && (
        <div
          style={{
            padding: '0.75rem',
            background: 'var(--bg-surface)',
            border: '1px solid #f59e0b',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#d97706' }}>
            ⚠️ Yêu cầu làm lại & chuyển về cột TODO:
          </label>
          <input
            type="text"
            className="form-input"
            placeholder="Nhập góp ý / những điểm cần chỉnh sửa..."
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAction(TaskStatus.TODO, rejectNote || 'Admin yêu cầu chỉnh sửa lại công việc');
              }
            }}
            style={{ fontSize: '0.8125rem' }}
            autoFocus
          />
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <Button variant="ghost" size="sm" onClick={() => setShowReworkInput(false)}>
              Hủy
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={isLoading}
              onClick={() => handleAction(TaskStatus.TODO, rejectNote || 'Admin yêu cầu chỉnh sửa lại công việc')}
            >
              Xác nhận trả về TODO
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
