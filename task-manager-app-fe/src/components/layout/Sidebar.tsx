import React from 'react';
import { Icon, IconName } from '../common/Icon';
import { Avatar } from '../common/Avatar';
import { useAuth } from '../../hooks/useAuth';

export type TabType = 'dashboard' | 'board' | 'projects' | 'profile' | 'users';

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onOpenProfile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  onOpenProfile,
}) => {
  const { user, logout } = useAuth();

  const navItems: { id: TabType; label: string; icon: IconName }[] = [
    { id: 'dashboard', label: 'Tổng quan (Dashboard)', icon: 'layout-dashboard' },
    { id: 'board', label: 'Bảng Kanban (Board)', icon: 'kanban' },
    { id: 'projects', label: 'Dự án (Projects)', icon: 'folder' },
    { id: 'users', label: "Người dùng (Users)", icon: 'users'}
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="brand-logo">T</div>
        <span className="brand-name">TaskManager</span>
      </div>

      <div className="sidebar-content">
        <div className="nav-section">
          <div className="nav-section-title">Menu Chính</div>
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => onTabChange(item.id)}
            >
              <Icon name={item.icon} size={18} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="sidebar-footer">
        <div className="user-mini-profile" onClick={onOpenProfile} title="Xem hồ sơ">
          <Avatar name={user?.fullName || 'User'} src={user?.avatar || user?.avatarUrl} size="sm" />
          <div className="user-mini-info" style={{ minWidth: 0 }}>
            <div className="user-mini-name">{user?.fullName || 'User'}</div>
            <div className="user-mini-email">{user?.email || `@${user?.username}`}</div>
          </div>
        </div>

        <button
          className="btn btn-ghost btn-icon"
          onClick={logout}
          title="Đăng xuất"
          aria-label="Logout"
        >
          <Icon name="log-out" size={18} />
        </button>
      </div>
    </aside>
  );
};
