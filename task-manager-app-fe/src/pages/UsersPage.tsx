import React, { useState } from 'react';
import { User } from '../types/user.types';
import { CreateUserPayload, UpdateUserPayload } from '../services/userService';
import { Avatar } from '../components/common/Avatar';
import { Button } from '../components/common/Button';
import { Icon } from '../components/common/Icon';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { UserModal } from '../components/users/UserModal';
import { ConfirmModal } from '../components/common/ConfirmModal';

interface UsersPageProps {
  currentUser?: User | null;
  users: User[];
  filteredUsers: User[];
  paginatedUsers: User[];
  isLoading: boolean;
  error: string | null;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  statusFilter: number | 'all';
  onStatusFilterChange: (status: number | 'all') => void;
  page: number;
  onPageChange: (p: number) => void;
  pageSize: number;
  onPageSizeChange: (ps: number) => void;
  totalPages: number;
  onCreateUser: (payload: CreateUserPayload) => Promise<unknown>;
  onUpdateUser: (userId: number, payload: UpdateUserPayload) => Promise<unknown>;
  onDeleteUser: (userId: number) => Promise<unknown>;
}

export const UsersPage: React.FC<UsersPageProps> = ({
  currentUser,
  users,
  filteredUsers,
  paginatedUsers,
  isLoading,
  error: _error,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  page,
  onPageChange,
  pageSize,
  onPageSizeChange,
  totalPages,
  onCreateUser,
  onUpdateUser,
  onDeleteUser,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // Phân quyền: Kiểm tra người dùng hiện tại có phải là ADMIN (role = 1 hoặc dev123)
  const isAdmin = currentUser?.role === 1 || currentUser?.username === 'dev123';

  if (isLoading) {
    return <LoadingSpinner text="Đang tải danh sách người dùng..." />;
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '---';
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getStatusBadge = (status?: number) => {
    switch (status) {
      case 2:
        return {
          label: 'Đang bị khóa',
          bg: 'rgba(239, 68, 68, 0.12)',
          color: '#dc2626',
          border: 'rgba(239, 68, 68, 0.25)',
          dot: '#dc2626',
        };
      case 3:
        return {
          label: 'Vô hiệu hóa',
          bg: 'rgba(245, 158, 11, 0.12)',
          color: '#d97706',
          border: 'rgba(245, 158, 11, 0.25)',
          dot: '#d97706',
        };
      case 1:
      default:
        return {
          label: 'Hoạt động',
          bg: 'rgba(16, 185, 129, 0.12)',
          color: '#059669',
          border: 'rgba(16, 185, 129, 0.25)',
          dot: '#059669',
        };
    }
  };

  const getRoleBadge = (role?: number) => {
    if (role === 1) {
      return {
        label: '👑 Quản trị viên',
        bg: 'rgba(139, 92, 246, 0.12)',
        color: '#7c3aed',
        border: 'rgba(139, 92, 246, 0.25)',
      };
    }
    return {
      label: '👤 Thành viên',
      bg: 'rgba(59, 130, 246, 0.12)',
      color: '#2563eb',
      border: 'rgba(59, 130, 246, 0.25)',
    };
  };

  const handleStatusChange = async (userId: number, newStatus: number) => {
    if (!isAdmin) return;
    setUpdatingId(userId);
    try {
      await onUpdateUser(userId, { status: newStatus });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRoleChange = async (userId: number, newRole: number) => {
    if (!isAdmin) return;
    setUpdatingId(userId);
    try {
      await onUpdateUser(userId, { role: newRole });
    } finally {
      setUpdatingId(null);
    }
  };

  const activeCount = users.filter((u) => (u.status ?? 1) === 1).length;
  const lockedCount = users.filter((u) => u.status === 2).length;
  const disabledCount = users.filter((u) => u.status === 3).length;

  const startIndex = filteredUsers.length > 0 ? (page - 1) * pageSize + 1 : 0;
  const endIndex = Math.min(page * pageSize, filteredUsers.length);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', paddingBottom: '2rem' }}>
      {/* 🌟 Premium Hero Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(168, 85, 247, 0.08) 100%)',
          borderRadius: 'var(--radius-xl)',
          padding: '1.75rem 2rem',
          border: '1px solid rgba(99, 102, 241, 0.18)',
          boxShadow: '0 4px 20px -2px rgba(99, 102, 241, 0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 8px 16px -4px rgba(99, 102, 241, 0.4)',
            }}
          >
            <Icon name="users" size={26} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
                Quản Lý Người Dùng
              </h1>
              <span
                style={{
                  backgroundColor: 'rgba(99, 102, 241, 0.12)',
                  color: 'var(--primary-600)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.65rem',
                  borderRadius: '999px',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                }}
              >
                {users.length} Tài khoản
              </span>
              <span
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  color: '#059669',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.65rem',
                  borderRadius: '999px',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                }}
              >
                {activeCount} Hoạt động
              </span>
              {lockedCount > 0 && (
                <span
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.12)',
                    color: '#dc2626',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.65rem',
                    borderRadius: '999px',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                  }}
                >
                  {lockedCount} Đang bị khóa
                </span>
              )}
              {disabledCount > 0 && (
                <span
                  style={{
                    backgroundColor: 'rgba(245, 158, 11, 0.12)',
                    color: '#d97706',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.65rem',
                    borderRadius: '999px',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                  }}
                >
                  {disabledCount} Vô hiệu hóa
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '0.35rem 0 0 0' }}>
              {isAdmin
                ? '🔑 Bạn có quyền Quản trị viên: Có thể phân quyền Vai trò & Đổi Trạng thái tất cả tài khoản'
                : '👁️ Quyền Thành viên: Xem thông tin danh sách người dùng trong hệ thống'}
            </p>
          </div>
        </div>

        {isAdmin && (
          <Button
            variant="primary"
            icon="plus"
            onClick={() => {
              setSelectedUser(null);
              setIsModalOpen(true);
            }}
            style={{
              padding: '0.75rem 1.35rem',
              fontWeight: 700,
              boxShadow: '0 6px 16px -2px rgba(99, 102, 241, 0.35)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            Thêm người dùng
          </Button>
        )}
      </div>

      {/* 🔍 Controls, Search & Status Filter Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
          backgroundColor: 'var(--bg-surface)',
          padding: '1rem 1.25rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ position: 'relative', minWidth: '260px', flex: 1, maxWidth: '420px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Tìm kiếm theo Tên tài khoản, Họ tên, Email..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              paddingLeft: '2.6rem',
              borderRadius: 'var(--radius-md)',
              height: '42px',
              fontSize: '0.875rem',
            }}
          />
          <span style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
            <Icon name="search" size={17} />
          </span>
        </div>

        {/* Status Filter Select */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.845rem', color: 'var(--text-secondary)' }}>
            <Icon name="filter" size={15} />
            <span style={{ fontWeight: 600 }}>Trạng thái:</span>
          </div>

          <select
            className="form-input"
            value={statusFilter}
            onChange={(e) => {
              const val = e.target.value;
              onStatusFilterChange(val === 'all' ? 'all' : Number(val));
            }}
            style={{
              height: '42px',
              fontSize: '0.845rem',
              borderRadius: 'var(--radius-md)',
              padding: '0 0.85rem',
              cursor: 'pointer',
              fontWeight: 600,
              minWidth: '160px',
            }}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value={1}>🟢 Hoạt động</option>
            <option value={2}>🔴 Đang bị khóa</option>
            <option value={3}>🟡 Vô hiệu hóa</option>
          </select>
        </div>

        <div style={{ fontSize: '0.845rem', color: 'var(--text-secondary)' }}>
          Kết quả tìm kiếm: <strong>{filteredUsers.length}</strong> người dùng
        </div>
      </div>

      {/* 📊 Modern Glassmorphism Data Table */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-color)',
          overflow: 'hidden',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.04)',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr
              style={{
                borderBottom: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-surface-secondary)',
                color: 'var(--text-muted)',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              <th style={{ padding: '1.1rem 1.5rem', fontWeight: 700 }}>Thành viên</th>
              <th style={{ padding: '1.1rem 1.5rem', fontWeight: 700 }}>Tên tài khoản</th>
              <th style={{ padding: '1.1rem 1.5rem', fontWeight: 700 }}>Vai trò</th>
              <th style={{ padding: '1.1rem 1.5rem', fontWeight: 700 }}>Email liên hệ</th>
              <th style={{ padding: '1.1rem 1.5rem', fontWeight: 700 }}>Trạng thái</th>
              <th style={{ padding: '1.1rem 1.5rem', fontWeight: 700 }}>Ngày khởi tạo</th>
              {isAdmin && <th style={{ padding: '1.1rem 1.5rem', fontWeight: 700, textAlign: 'right' }}>Thao tác</th>}
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 7 : 6} style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)' }}>
                    <Icon name="search" size={40} />
                    <p style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>Không tìm thấy tài khoản người dùng phù hợp</p>
                    <span style={{ fontSize: '0.845rem' }}>Hãy thử điều chỉnh lại từ khóa tìm kiếm hoặc bộ lọc trạng thái</span>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedUsers.map((u) => {
                const statusBadge = getStatusBadge(u.status);
                const roleBadge = getRoleBadge(u.role);
                const isUpdating = updatingId === u.id;

                return (
                  <tr
                    key={u.id}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      transition: 'all var(--transition-fast)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.03)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    {/* Thành viên (Avatar & Full Name) */}
                    <td style={{ padding: '1.1rem 1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                        <div style={{ position: 'relative' }}>
                          <Avatar name={u.fullName || u.username} src={u.avatar || u.avatarUrl} size="md" />
                          <span
                            style={{
                              position: 'absolute',
                              bottom: 0,
                              right: 0,
                              width: 10,
                              height: 10,
                              borderRadius: '50%',
                              backgroundColor: statusBadge.dot,
                              border: '2px solid var(--bg-surface)',
                            }}
                            title={statusBadge.label}
                          />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.925rem' }}>
                            {u.fullName || u.username}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Username Pill */}
                    <td style={{ padding: '1.1rem 1.5rem' }}>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          color: 'var(--primary-600)',
                          backgroundColor: 'rgba(99, 102, 241, 0.08)',
                          padding: '0.25rem 0.65rem',
                          borderRadius: 'var(--radius-sm)',
                          fontWeight: 700,
                          fontSize: '0.845rem',
                          border: '1px solid rgba(99, 102, 241, 0.2)',
                        }}
                      >
                        @{u.username}
                      </span>
                    </td>

                    {/* Vai trò Column */}
                    <td style={{ padding: '1.1rem 1.5rem' }}>
                      {isAdmin ? (
                        <select
                          value={u.role || 2}
                          onChange={(e) => void handleRoleChange(u.id, Number(e.target.value))}
                          disabled={isUpdating}
                          style={{
                            backgroundColor: roleBadge.bg,
                            color: roleBadge.color,
                            border: `1px solid ${roleBadge.border}`,
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            padding: '0.3rem 0.65rem',
                            borderRadius: '999px',
                            cursor: 'pointer',
                            outline: 'none',
                            boxShadow: 'var(--shadow-sm)',
                          }}
                        >
                          <option value={1} style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)' }}>👑 Quản trị viên</option>
                          <option value={2} style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)' }}>👤 Thành viên</option>
                        </select>
                      ) : (
                        <span
                          style={{
                            backgroundColor: roleBadge.bg,
                            color: roleBadge.color,
                            border: `1px solid ${roleBadge.border}`,
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            padding: '0.3rem 0.65rem',
                            borderRadius: '999px',
                            display: 'inline-block',
                          }}
                        >
                          {roleBadge.label}
                        </span>
                      )}
                    </td>

                    {/* Email */}
                    <td style={{ padding: '1.1rem 1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                      {u.email ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Icon name="user" size={14} color="var(--text-muted)" />
                          <span>{u.email}</span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Chưa cập nhật</span>
                      )}
                    </td>

                    {/* Trạng thái Column */}
                    <td style={{ padding: '1.1rem 1.5rem' }}>
                      {isAdmin ? (
                        <select
                          value={u.status || 1}
                          onChange={(e) => void handleStatusChange(u.id, Number(e.target.value))}
                          disabled={isUpdating}
                          style={{
                            backgroundColor: statusBadge.bg,
                            color: statusBadge.color,
                            border: `1px solid ${statusBadge.border}`,
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            padding: '0.3rem 0.75rem',
                            borderRadius: '999px',
                            cursor: 'pointer',
                            outline: 'none',
                            boxShadow: 'var(--shadow-sm)',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <option value={1} style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)' }}>🟢 Hoạt động</option>
                          <option value={2} style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)' }}>🔴 Đang bị khóa</option>
                          <option value={3} style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)' }}>🟡 Vô hiệu hóa</option>
                        </select>
                      ) : (
                        <span
                          style={{
                            backgroundColor: statusBadge.bg,
                            color: statusBadge.color,
                            border: `1px solid ${statusBadge.border}`,
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            padding: '0.3rem 0.75rem',
                            borderRadius: '999px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                          }}
                        >
                          <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: statusBadge.dot }} />
                          {statusBadge.label}
                        </span>
                      )}
                    </td>

                    {/* Ngày khởi tạo */}
                    <td style={{ padding: '1.1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.845rem' }}>
                      {formatDate(u.createdAt)}
                    </td>

                    {/* Thao tác */}
                    {isAdmin && (
                      <td style={{ padding: '1.1rem 1.5rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          <Button
                            variant="secondary"
                            size="icon"
                            icon="edit"
                            onClick={() => {
                              setSelectedUser(u);
                              setIsModalOpen(true);
                            }}
                            title="Chỉnh sửa thông tin"
                            style={{ borderRadius: 'var(--radius-md)' }}
                          />
                          <Button
                            variant="danger"
                            size="icon"
                            icon="trash"
                            onClick={() => setDeletingUser(u)}
                            title="Xóa tài khoản"
                            style={{ borderRadius: 'var(--radius-md)' }}
                          />
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* 📄 Glassmorphism Pagination Footer Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-surface-secondary)',
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
          }}
        >
          {/* Thông tin số lượng hiển thị */}
          <div>
            Hiển thị <strong style={{ color: 'var(--text-primary)' }}>{startIndex}</strong> - <strong style={{ color: 'var(--text-primary)' }}>{endIndex}</strong> trong tổng số <strong style={{ color: 'var(--primary-600)' }}>{filteredUsers.length}</strong> người dùng
          </div>

          {/* Chọn số dòng hiển thị mỗi trang */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span>Hiển thị mỗi trang:</span>
            <select
              className="form-input"
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                onPageChange(1);
              }}
              style={{
                height: '34px',
                padding: '0 0.6rem',
                fontSize: '0.845rem',
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

          {/* Thanh chuyển trang (Page Numbers & Prev/Next Buttons) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem', fontWeight: 600 }}
            >
              Trang trước
            </Button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
              <button
                key={pNum}
                onClick={() => onPageChange(pNum)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-md)',
                  border: pNum === page ? '1px solid var(--primary-600)' : '1px solid var(--border-color)',
                  background: pNum === page ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' : 'var(--bg-surface)',
                  color: pNum === page ? '#ffffff' : 'var(--text-primary)',
                  fontWeight: pNum === page ? 700 : 500,
                  fontSize: '0.845rem',
                  cursor: 'pointer',
                  boxShadow: pNum === page ? '0 4px 12px rgba(99, 102, 241, 0.3)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                {pNum}
              </button>
            ))}

            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem', fontWeight: 600 }}
            >
              Trang sau
            </Button>
          </div>
        </div>
      </div>

      {/* User Create/Edit Modal */}
      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={selectedUser}
        onCreateUser={onCreateUser}
        onUpdateUser={onUpdateUser}
      />

      {/* Custom Confirm Modal for Delete */}
      <ConfirmModal
        isOpen={deletingUser !== null}
        onClose={() => setDeletingUser(null)}
        onConfirm={async () => {
          if (deletingUser) {
            await onDeleteUser(deletingUser.id);
          }
        }}
        title="Xóa tài khoản người dùng"
        message={`Bạn có chắc chắn muốn xóa tài khoản "${deletingUser?.username}" (${deletingUser?.fullName})? Tất cả dữ liệu liên quan sẽ bị xóa khỏi hệ thống.`}
        confirmText="Xóa tài khoản"
      />
    </div>
  );
};
