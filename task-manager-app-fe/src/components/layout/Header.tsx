import React, { useState, useEffect } from 'react';
import { Icon } from '../common/Icon';
import { Button } from '../common/Button';
import { Avatar } from '../common/Avatar';
import { Project } from '../../types/project.types';
import { useAuth } from '../../hooks/useAuth';

interface HeaderProps {
  projects: Project[];
  activeProject: Project | null;
  onSelectProject: (project: Project) => void;
  onOpenCreateTask: () => void;
  onOpenMembers: () => void;
  onOpenProfile: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  projects,
  activeProject,
  onSelectProject,
  onOpenCreateTask,
  onOpenMembers,
  onOpenProfile,
}) => {
  const { user } = useAuth();
  const [isDark, setIsDark] = useState<boolean>(false);

  useEffect(() => {
    const theme = localStorage.getItem('app_theme');
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      setIsDark(true);
    }
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('app_theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('app_theme', 'light');
    }
  };

  return (
    <header className="top-header">
      <div className="header-left">
        {activeProject ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <select
              className="project-selector"
              value={activeProject.id}
              onChange={(e) => {
                const found = projects.find((p) => p.id === Number(e.target.value));
                if (found) onSelectProject(found);
              }}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  📁 {p.name}
                </option>
              ))}
            </select>

            <Button
              variant="ghost"
              size="sm"
              icon="users"
              onClick={onOpenMembers}
              title="Quản lý thành viên dự án"
            >
              Thành viên ({activeProject.members?.length || 0})
            </Button>
          </div>
        ) : (
          <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>
            Chưa chọn dự án
          </span>
        )}
      </div>

      <div className="header-right">
        {activeProject && (
          <Button variant="primary" size="sm" icon="plus" onClick={onOpenCreateTask}>
            Tạo Task
          </Button>
        )}

        <button
          className="btn btn-ghost btn-icon"
          onClick={toggleTheme}
          title={isDark ? 'Giao diện Sáng' : 'Giao diện Tối'}
          aria-label="Toggle Theme"
        >
          <Icon name={isDark ? 'sun' : 'moon'} size={18} />
        </button>

        <div onClick={onOpenProfile} style={{ cursor: 'pointer' }}>
          <Avatar name={user?.fullName || 'User'} src={user?.avatarUrl} size="sm" />
        </div>
      </div>
    </header>
  );
};
