import React, { useState } from 'react';
import { LoginForm } from '../components/auth/LoginForm';
import { RegisterForm } from '../components/auth/RegisterForm';
import { Icon } from '../components/common/Icon';

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        background: 'var(--bg-app)',
      }}
    >
      {/* Left Column: Branding & Feature Highlights */}
      <div
        style={{
          flex: 1,
          background: 'linear-gradient(135deg, #312e81 0%, #4338ca 50%, #6366f1 100%)',
          color: 'white',
          padding: '4rem 3rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
        }}
        className="auth-hero-section"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: 'var(--radius-md)',
              background: 'white',
              color: 'var(--primary-600)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.25rem',
            }}
          >
            T
          </div>
          <span style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            TaskManager
          </span>
        </div>

        <div style={{ maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1.15 }}>
            Quản lý công việc cá nhân & nhóm chuyên nghiệp
          </h1>
          <p style={{ fontSize: '1rem', color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.6 }}>
            Trực quan hóa quy trình làm việc với Kanban Board kéo thả, phân chia quyền hạn dự án, theo dõi tiến độ và trao đổi thời gian thực.
          </p>

          {/* Feature list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginTop: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9375rem' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.2)', padding: '0.35rem', borderRadius: 'var(--radius-full)' }}>
                <Icon name="kanban" size={16} />
              </div>
              <span>Kanban Board trực quan (TODO → DOING → DONE)</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9375rem' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.2)', padding: '0.35rem', borderRadius: 'var(--radius-full)' }}>
                <Icon name="users" size={16} />
              </div>
              <span>Phân quyền thành viên: Owner, Admin, Member</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9375rem' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.2)', padding: '0.35rem', borderRadius: 'var(--radius-full)' }}>
                <Icon name="tag" size={16} />
              </div>
              <span>Nhãn dán, file đính kèm & lịch sử thao tác chi tiết</span>
            </div>
          </div>
        </div>

        <div style={{ fontSize: '0.8125rem', color: 'rgba(255, 255, 255, 0.6)' }}>
          © 2026 Task Management System. All rights reserved.
        </div>
      </div>

      {/* Right Column: Form Container */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2.5rem',
          maxWidth: '560px',
          margin: '0 auto',
        }}
      >
        {isLogin ? (
          <LoginForm onSwitchToRegister={() => setIsLogin(false)} />
        ) : (
          <RegisterForm onSwitchToLogin={() => setIsLogin(true)} />
        )}
      </div>
    </div>
  );
};
