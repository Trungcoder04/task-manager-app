import React, { ReactNode } from 'react';
import { TaskPriorityType, TaskStatusType } from '../../types/task.types';

interface BadgeProps {
  children?: ReactNode;
  variant?: 'priority-high' | 'priority-medium' | 'priority-low' | 'role-admin' | 'role-member' | 'default';
  priority?: TaskPriorityType;
  status?: TaskStatusType;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant,
  priority,
  status,
  className = '',
}) => {
  let badgeVariant = variant || 'default';

  if (priority !== undefined) {
    if (priority === 3) badgeVariant = 'priority-high';
    else if (priority === 2) badgeVariant = 'priority-medium';
    else badgeVariant = 'priority-low';
  }

  const getPriorityText = () => {
    if (priority === 3) return 'Cao';
    if (priority === 2) return 'Trung bình';
    return 'Thấp';
  };

  const getStatusText = () => {
    if (status === 0) return 'Chờ duyệt';
    if (status === 1) return 'Cần làm';
    if (status === 2) return 'Đang làm';
    if (status === 3) return 'Chờ nghiệm thu';
    if (status === 4) return 'Hoàn thành';
    if (status === 5) return 'Bị từ chối';
    return '';
  };

  const displayText = children || (priority !== undefined ? getPriorityText() : status !== undefined ? getStatusText() : '');

  return <span className={`badge badge-${badgeVariant} ${className}`}>{displayText}</span>;
};
