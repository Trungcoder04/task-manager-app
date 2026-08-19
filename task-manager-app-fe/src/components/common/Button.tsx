import React, { ButtonHTMLAttributes, ReactNode } from 'react';
import { Icon, IconName } from './Icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'icon';
  icon?: IconName;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
  children?: ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  isLoading = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const btnClass = `btn btn-${variant} ${size === 'sm' ? 'btn-sm' : ''} ${
    size === 'icon' ? 'btn-icon' : ''
  } ${className}`.trim();

  return (
    <button className={btnClass} disabled={disabled || isLoading} {...props}>
      {isLoading && <span className="spinner" style={{ width: 14, height: 14 }} />}
      {!isLoading && icon && iconPosition === 'left' && <Icon name={icon} size={16} />}
      {children}
      {!isLoading && icon && iconPosition === 'right' && <Icon name={icon} size={16} />}
    </button>
  );
};
