import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Avatar } from '../common/Avatar';
import { User } from '../../types/user.types';
import { userService } from '../../services/userService';
import { useToast } from '../../hooks/useToast';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onUserUpdated: (user: User) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onUserUpdated,
}) => {
  const [oldPassword, setOldPassword] = useState('')
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      setEmail(user.email || '');
    }
    setOldPassword('');
    setPassword('');
    setConfirmPassword('');
    setError('');
  }, [user, isOpen]);

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Vui lòng nhập họ và tên');
      return;
    }

    if (password || oldPassword) {
      if (!oldPassword) {
        setError('Vui lòng nhập mật khẩu hiện tại');
        return;
      }

      if (!password) {
        setError('Vui lòng nhập mật khẩu mới');
        return;
      }

      if (password.length < 6) {
        setError('Mật khẩu mới phải có ít nhất 6 ký tự');
        return;
      }

      if (password !== confirmPassword) {
        setError('Mật khẩu xác nhận không khớp');
        return;
      }
    }

    setIsLoading(true);
    setError('');
    try {
      const updated = await userService.updateUser(user.id, {
        fullName: fullName.trim(),
        email: email.trim() || undefined,
        password: password || undefined,
        oldPassword: oldPassword || undefined,
      });
      onUserUpdated(updated);
      showToast('Cập nhật hồ sơ thành công!', 'success');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cập nhật thất bại');
      showToast(err instanceof Error ? err.message : 'Cập nhật thất bại', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Thông tin Tài khoản"
      maxWidth="480px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* User Card Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1rem',
            background: 'var(--bg-surface-secondary)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <Avatar name={user.fullName} src={user.avatarUrl} size="lg" />
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 800 }}>{user.fullName}</h4>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              @{user.username}
            </span>
          </div>
        </div>

        {error && (
          <div
            style={{
              background: 'var(--priority-high-bg)',
              color: 'var(--priority-high)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8125rem',
              fontWeight: 600,
            }}
          >
            {error}
          </div>
        )}

        <Input
          label="Tên đăng nhập"
          value={user.username}
          disabled
          helperText="Tên đăng nhập không thể thay đổi"
        />

        <Input
          label="Họ và tên"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          disabled={isLoading}
          required
        />

        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
        />

        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.75rem' }}>
            Đổi mật khẩu (Bỏ trống nếu không muốn đổi)
          </span>
          <Input
            label="Mật khẩu cũ"
            type="password"
            placeholder="••••••••"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            disabled={isLoading}
          />
          <Input
            label="Mật khẩu mới"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />

          <Input
            label="Xác nhận mật khẩu mới"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Hủy
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            Lưu thay đổi
          </Button>
        </div>
      </form>
    </Modal>
  );
};
