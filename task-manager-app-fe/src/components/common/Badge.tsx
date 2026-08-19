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
    if (priority === 3) return 'High';
    if (priority === 2) return 'Medium';
    return 'Low';
  };

  const getStatusText = () => {
    if (status === 1) return 'TODO';
    if (status === 2) return 'DOING';
    return 'DONE';
  };

  const displayText = children || (priority !== undefined ? getPriorityText() : status !== undefined ? getStatusText() : '');

  return <span className={`badge badge-${badgeVariant} ${className}`}>{displayText}</span>;
};
