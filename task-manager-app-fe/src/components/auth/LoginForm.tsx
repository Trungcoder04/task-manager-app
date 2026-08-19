import React, { useState } from 'react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Icon } from '../common/Icon';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

interface LoginFormProps {
  onSwitchToRegister: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Vui lòng nhập tên đăng nhập hoặc email');
      return;
    }
    if (!password) {
      setError('Vui lòng nhập mật khẩu');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await login({ username: username.trim(), password });
      showToast('Đăng nhập thành công!', 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Tài khoản hoặc mật khẩu không chính xác';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDemo = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError('');
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
        Chào mừng trở lại! 👋
      </h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
        Đăng nhập vào hệ thống Task Manager để tiếp tục quản lý công việc.
      </p>

      {/* Demo Account Helper */}
      <div
        style={{
          background: 'rgba(99, 102, 241, 0.08)',
          border: '1px dashed var(--primary-300)',
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.25rem',
          fontSize: '0.8125rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span>
          💡 Tài khoản mẫu Backend: <strong>admin</strong> / <strong>admin123</strong>
        </span>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          style={{ color: 'var(--primary-500)', fontWeight: 700, padding: '0.2rem 0.5rem' }}
          onClick={() => handleFillDemo('admin', 'admin123')}
        >
          Điền nhanh
        </button>
      </div>

      {error && (
        <div
          style={{
            background: 'var(--priority-high-bg)',
            color: 'var(--priority-high)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.25rem',
            fontSize: '0.8125rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Icon name="alert-circle" size={16} />
          <span>{error}</span>
        </div>
      )}

      <Input
        label="Tên đăng nhập hoặc Email"
        placeholder="admin hoặc admin@example.com"
        value={username}
        onChange={(e) => {
          setUsername(e.target.value);
          if (error) setError('');
        }}
        disabled={isLoading}
        required
      />

      <Input
        label="Mật khẩu"
        type="password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          if (error) setError('');
        }}
        disabled={isLoading}
        required
      />

      <Button
        type="submit"
        variant="primary"
        style={{ width: '100%', marginTop: '0.5rem' }}
        isLoading={isLoading}
      >
        Đăng nhập
      </Button>

      <div
        style={{
          marginTop: '1.5rem',
          textAlign: 'center',
          fontSize: '0.875rem',
          color: 'var(--text-secondary)',
        }}
      >
        Chưa có tài khoản?{' '}
        <span
          onClick={onSwitchToRegister}
          style={{
            color: 'var(--primary-500)',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Đăng ký ngay
        </span>
      </div>
    </form>
  );
};
