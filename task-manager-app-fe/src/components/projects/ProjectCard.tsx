import React from 'react';
import { Project } from '../../types/project.types';
import { Avatar } from '../common/Avatar';
import { Button } from '../common/Button';

interface ProjectCardProps {
  project: Project;
  isActive: boolean;
  onSelect: (project: Project) => void;
  onEdit: (project: Project) => void;
  onDelete: (id: number) => void;
  onManageMembers: (project: Project) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  isActive,
  onSelect,
  onEdit,
  onDelete,
  onManageMembers,
}) => {
  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: `2px solid ${isActive ? 'var(--primary-500)' : 'var(--border-color)'}`,
        borderRadius: 'var(--radius-xl)',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        boxShadow: isActive ? 'var(--shadow-glow)' : 'var(--shadow-sm)',
        transition: 'all var(--transition-fast)',
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <h3
            style={{
              fontSize: '1.125rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              cursor: 'pointer',
            }}
            onClick={() => onSelect(project)}
          >
            {project.name}
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Chủ dự án: <strong>{project.owner?.fullName || 'Admin'}</strong>
          </span>
        </div>

        {isActive && (
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 800,
              color: 'var(--primary-500)',
              background: 'var(--primary-50)',
              padding: '0.2rem 0.5rem',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--primary-200)',
            }}
          >
            ĐANG CHỌN
          </span>
        )}
      </div>

      <p
        style={{
          fontSize: '0.875rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.4,
          minHeight: '2.8rem',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {project.description || 'Chưa có mô tả cho dự án này.'}
      </p>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '0.75rem',
          borderTop: '1px solid var(--border-color)',
        }}
      >
        <div
          className="avatar-group"
          onClick={() => onManageMembers(project)}
          style={{ cursor: 'pointer' }}
          title="Quản lý thành viên"
        >
          {(project.members || []).slice(0, 4).map((m) => (
            <Avatar
              key={m.userId}
              name={m.user?.fullName || 'Member'}
              src={m.user?.avatarUrl}
              size="sm"
            />
          ))}
          {(project.members?.length || 0) > 4 && (
            <div className="avatar avatar-sm" style={{ background: 'var(--text-muted)' }}>
              +{(project.members?.length || 0) - 4}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.375rem' }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelect(project)}
          >
            Mở Bảng
          </Button>
          <Button
            variant="secondary"
            size="icon"
            icon="edit"
            onClick={() => onEdit(project)}
            title="Chỉnh sửa dự án"
          />
          <Button
            variant="danger"
            size="icon"
            icon="trash"
            onClick={() => {
              if (confirm(`Bạn có chắc muốn xóa dự án "${project.name}"?`)) {
                onDelete(project.id);
              }
            }}
            title="Xóa dự án"
          />
        </div>
      </div>
    </div>
  );
};
