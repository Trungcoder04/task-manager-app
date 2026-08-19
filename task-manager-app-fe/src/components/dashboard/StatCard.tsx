import React from 'react';
import { Icon, IconName } from '../common/Icon';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: IconName;
  color: string;
  bgColor: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color,
  bgColor,
}) => {
  return (
    <div className="stat-card">
      <div className="stat-icon-wrap" style={{ background: bgColor, color }}>
        <Icon name={icon} size={24} />
      </div>
      <div className="stat-info">
        <span className="stat-value">{value}</span>
        <span className="stat-label">{title}</span>
      </div>
    </div>
  );
};
