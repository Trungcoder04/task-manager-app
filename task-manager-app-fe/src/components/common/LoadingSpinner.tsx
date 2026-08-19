import React from 'react';

interface LoadingSpinnerProps {
  text?: string;
  size?: number;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  text = 'Đang tải dữ liệu...',
  size = 28,
}) => {
  return (
    <div className="loading-container">
      <div className="spinner" style={{ width: size, height: size }} />
      {text && <span>{text}</span>}
    </div>
  );
};
