import React, { useState } from 'react';
import { Button } from './Button';
import { Icon } from './Icon';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Xác nhận xóa',
  message = 'Bạn có chắc chắn muốn thực hiện thao tác này? Hành động này không thể hoàn tác.',
  confirmText = 'Xóa ngay',
  cancelText = 'Hủy',
  variant = 'danger',
}) => {
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      console.error('Error during confirmation:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          iconColor: '#ef4444',
          iconBg: 'rgba(239, 68, 68, 0.12)',
          buttonVariant: 'danger' as const,
        };
      case 'warning':
        return {
          iconColor: '#f59e0b',
          iconBg: 'rgba(245, 158, 11, 0.12)',
          buttonVariant: 'primary' as const,
        };
      default:
        return {
          iconColor: '#6366f1',
          iconBg: 'rgba(99, 102, 241, 0.12)',
          buttonVariant: 'primary' as const,
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div
      className="drawer-overlay"
      onClick={onClose}
      style={{ zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div
        className="drawer-container"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '440px',
          width: '90%',
          maxHeight: 'fit-content',
          borderRadius: 'var(--radius-xl)',
          padding: '1.75rem',
          textAlign: 'center',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.25rem',
          transform: 'none',
          position: 'relative',
        }}
      >
        {/* Icon Badge */}
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: styles.iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: styles.iconColor,
          }}
        >
          <Icon name="alert-circle" size={28} />
        </div>

        {/* Text Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <h3
            style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              margin: 0,
              color: 'var(--text-primary)',
            }}
          >
            {title}
          </h3>
          <p
            style={{
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            {message}
          </p>
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            width: '100%',
            marginTop: '0.5rem',
          }}
        >
          <Button
            variant="ghost"
            style={{ flex: 1 }}
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={styles.buttonVariant}
            style={{ flex: 1 }}
            onClick={handleConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};
