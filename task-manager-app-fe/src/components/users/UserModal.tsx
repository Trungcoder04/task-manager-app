import React, { useState, useEffect } from 'react';
import { User } from '../../types/user.types';
import { CreateUserPayload, UpdateUserPayload } from '../../services/userService';
import { Button } from '../common/Button';
import { Icon } from '../common/Icon';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User | null;
  onCreateUser: (payload: CreateUserPayload) => Promise<unknown>;
  onUpdateUser: (userId: number, payload: UpdateUserPayload) => Promise<unknown>;
}

export const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  user,
  onCreateUser,
  onUpdateUser,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<number>(1);
  const [role, setRole] = useState<number>(2);
  const [isLoading, setIsLoading] = useState(false);

  const isEditing = !!user;

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setFullName(user.fullName || '');
      setEmail(user.email || '');
      setPassword('');
      setStatus(user.status || 1);
      setRole(user.role || 2);
    } else {
      setUsername('');
      setPassword('');
      setFullName('');
      setEmail('');
      setStatus(1);
      setRole(2);
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    setIsLoading(true);
    try {
      if (isEditing && user) {
        await onUpdateUser(user.id, {
          fullName: fullName.trim(),
          email: email.trim() || undefined,
          password: password ? password : undefined,
          status,
          role,
        });
      } else {
        if (!username.trim() || !password) return;
        await onCreateUser({
          username: username.trim(),
          password,
          fullName: fullName.trim(),
          email: email.trim() || undefined,
          status,
          role,
        });
      }
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1.25rem',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          width: '100%',
          maxWidth: '520px',
          overflow: 'hidden',
          animation: 'scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 🌟 Top Header with Gradient Badge */}
        <div
          style={{
            padding: '1.5rem 1.75rem',
            borderBottom: '1px solid var(--border-color)',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.06) 0%, rgba(168, 85, 247, 0.06) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 'var(--radius-lg)',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 6px 16px -2px rgba(99, 102, 241, 0.4)',
              }}
            >
              <Icon name={isEditing ? 'edit' : 'plus'} size={20} />
            </div>

            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.01em' }}>
                {isEditing ? 'Chỉnh Sửa Tài Khoản' : 'Tạo Tài Khoản Mới'}
              </h3>
              <p style={{ fontSize: '0.845rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                {isEditing ? `Cập nhật thông tin cho @${user.username}` : 'Điền thông tin bên dưới để cấp tài khoản mới'}
              </p>
            </div>
          </div>

          <button
            className="btn btn-ghost btn-icon"
            onClick={onClose}
            style={{ borderRadius: 'var(--radius-md)', color: 'var(--text-muted)' }}
          >
            <Icon name="x" size={20} />
          </button>
        </div>

        {/* 📝 Form Fields */}
        <form onSubmit={handleSubmit} style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Username Input */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>Tên đăng nhập</span>
              {!isEditing && <span style={{ color: 'var(--priority-high)' }}>*</span>}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Ví dụ: trungdev"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isEditing || isLoading}
                required={!isEditing}
                style={{
                  paddingLeft: '2.5rem',
                  fontFamily: isEditing ? 'monospace' : 'inherit',
                  fontWeight: isEditing ? 700 : 400,
                  backgroundColor: isEditing ? 'var(--bg-surface-secondary)' : undefined,
                }}
              />
              <span style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.9rem' }}>
                @
              </span>
            </div>
            {isEditing && (
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.3rem', display: 'block' }}>
                Tên đăng nhập là cố định và không thể thay đổi
              </span>
            )}
          </div>

          {/* Full Name Input */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>Họ và tên</span>
              <span style={{ color: 'var(--priority-high)' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Ví dụ: Nguyễn Văn Trung"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={isLoading}
                required
                style={{ paddingLeft: '2.5rem' }}
              />
              <span style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <Icon name="user" size={16} />
              </span>
            </div>
          </div>

          {/* Email Input */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              Email liên hệ (Tùy chọn)
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                className="form-input"
                placeholder="trungdev@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                style={{ paddingLeft: '2.5rem' }}
              />
              <span style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <Icon name="user" size={16} />
              </span>
            </div>
          </div>

          {/* Status Dropdown */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              Trạng thái tài khoản
            </label>
            <select
              className="form-input"
              value={status}
              onChange={(e) => setStatus(Number(e.target.value))}
              disabled={isLoading}
              style={{
                height: '42px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <option value={1}>🟢 Hoạt động</option>
              <option value={2}>🔴 Đang bị khóa</option>
              <option value={3}>🟡 Vô hiệu hóa</option>
            </select>
          </div>

          {/* Role Dropdown */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              Vai trò (Phân quyền)
            </label>
            <select
              className="form-input"
              value={role}
              onChange={(e) => setRole(Number(e.target.value))}
              disabled={isLoading}
              style={{
                height: '42px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <option value={1}>👑 Quản trị viên (Admin)</option>
              <option value={2}>👤 Thành viên (User)</option>
            </select>
          </div>

          {/* Password Input */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>{isEditing ? 'Mật khẩu mới (Để trống nếu giữ nguyên)' : 'Mật khẩu'}</span>
              {!isEditing && <span style={{ color: 'var(--priority-high)' }}>*</span>}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                className="form-input"
                placeholder={isEditing ? 'Nhập mật khẩu mới nếu muốn đổi...' : 'Mật khẩu bảo mật...'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required={!isEditing}
                style={{ paddingLeft: '2.5rem' }}
              />
              <span style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <Icon name="clock" size={16} />
              </span>
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              marginTop: '0.75rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid var(--border-color)',
            }}
          >
            <Button
              variant="ghost"
              type="button"
              onClick={onClose}
              disabled={isLoading}
              style={{ padding: '0.65rem 1.25rem', fontWeight: 600 }}
            >
              Hủy bỏ
            </Button>
            <Button
              variant="primary"
              type="submit"
              isLoading={isLoading}
              style={{
                padding: '0.65rem 1.5rem',
                fontWeight: 700,
                boxShadow: '0 4px 14px -2px rgba(99, 102, 241, 0.4)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              {isEditing ? 'Lưu thay đổi' : 'Tạo người dùng'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
