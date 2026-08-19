import React, { useState } from 'react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Icon } from '../common/Icon';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin }) => {
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim().length < 4) {
      setError('Tên đăng nhập phải có ít nhất 4 ký tự');
      return;
    }
    if (!fullName.trim()) {
      setError('Vui lòng nhập họ và tên');
      return;
    }
    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await register({
        username: username.trim(),
        fullName: fullName.trim(),
        email: email.trim() || undefined,
        password,
      });
      showToast('Đăng ký tài khoản thành công!', 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Đăng ký thất bại';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
        Tạo tài khoản mới 🚀
      </h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        Đăng ký nhanh chóng để bắt đầu tổ chức và theo dõi công việc hiệu quả.
      </p>

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
        label="Họ và tên"
        placeholder="Nguyễn Văn A"
        value={fullName}
        onChange={(e) => {
          setFullName(e.target.value);
          if (error) setError('');
        }}
        disabled={isLoading}
        required
      />

      <Input
        label="Tên đăng nhập"
        placeholder="nguyenvana"
        value={username}
        onChange={(e) => {
          setUsername(e.target.value);
          if (error) setError('');
        }}
        disabled={isLoading}
        helperText="Tối thiểu 4 ký tự"
        required
      />

      <Input
        label="Email (tùy chọn)"
        type="email"
        placeholder="vana@example.com"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (error) setError('');
        }}
        disabled={isLoading}
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
        helperText="Tối thiểu 6 ký tự"
        required
      />

      <Button
        type="submit"
        variant="primary"
        style={{ width: '100%', marginTop: '0.5rem' }}
        isLoading={isLoading}
      >
        Tạo tài khoản
      </Button>

      <div
        style={{
          marginTop: '1.5rem',
          textAlign: 'center',
          fontSize: '0.875rem',
          color: 'var(--text-secondary)',
        }}
      >
        Đã có tài khoản?{' '}
        <span
          onClick={onSwitchToLogin}
          style={{
            color: 'var(--primary-500)',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Đăng nhập ngay
        </span>
      </div>
    </form>
  );
};
