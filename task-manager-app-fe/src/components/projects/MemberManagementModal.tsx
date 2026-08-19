import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Avatar } from '../common/Avatar';
import { Badge } from '../common/Badge';
import { Icon } from '../common/Icon';
import { Project, ProjectMemberRoleType } from '../../types/project.types';
import { User } from '../../types/user.types';
import { userService } from '../../services/userService';

interface MemberManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onAddMember: (projectId: number, userId: number, role: ProjectMemberRoleType) => Promise<void>;
  onRemoveMember: (projectId: number, userId: number) => Promise<void>;
  onUpdateRole: (projectId: number, userId: number, role: ProjectMemberRoleType) => Promise<void>;
}

export const MemberManagementModal: React.FC<MemberManagementModalProps> = ({
  isOpen,
  onClose,
  project,
  onAddMember,
  onRemoveMember,
  onUpdateRole,
}) => {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('');
  const [selectedRole, setSelectedRole] = useState<ProjectMemberRoleType>(2);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      void userService.getUsers().then((users) => setAllUsers(users));
    }
  }, [isOpen]);

  if (!project) return null;

  const currentMemberIds = (project.members || []).map((m) => m.userId);
  const availableUsers = allUsers.filter((u) => !currentMemberIds.includes(u.id));

  const handleAdd = async () => {
    if (!selectedUserId) return;
    setIsLoading(true);
    try {
      await onAddMember(project.id, Number(selectedUserId), selectedRole);
      setSelectedUserId('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Thành viên: ${project.name}`}
      maxWidth="580px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Invite Member Section */}
        <div
          style={{
            background: 'var(--bg-surface-secondary)',
            padding: '1.25rem',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.875rem',
          }}
        >
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Mời thành viên mới vào dự án
          </span>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <select
              className="form-select"
              style={{ flex: 2, minWidth: '180px' }}
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">-- Chọn người dùng --</option>
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName} (@{u.username})
                </option>
              ))}
            </select>

            <select
              className="form-select"
              style={{ flex: 1, minWidth: '120px' }}
              value={selectedRole}
              onChange={(e) => setSelectedRole(Number(e.target.value) as ProjectMemberRoleType)}
            >
              <option value={2}>MEMBER</option>
              <option value={1}>ADMIN</option>
            </select>

            <Button
              variant="primary"
              size="sm"
              icon="plus"
              onClick={handleAdd}
              disabled={!selectedUserId || isLoading}
              isLoading={isLoading}
            >
              Mời
            </Button>
          </div>
        </div>

        {/* Member List */}
        <div>
          <h4 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            Danh sách thành viên ({project.members?.length || 0})
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {(project.members || []).map((member) => {
              const isOwner = project.ownerId === member.userId;

              return (
                <div
                  key={member.userId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Avatar
                      name={member.user?.fullName || 'User'}
                      src={member.user?.avatarUrl}
                      size="sm"
                    />
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>
                        {member.user?.fullName || 'User'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        @{member.user?.username}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {isOwner ? (
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          color: 'var(--primary-500)',
                          background: 'var(--primary-50)',
                          padding: '0.2rem 0.6rem',
                          borderRadius: 'var(--radius-full)',
                        }}
                      >
                        OWNER
                      </span>
                    ) : (
                      <select
                        className="form-select"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.8125rem' }}
                        value={member.role}
                        onChange={(e) =>
                          void onUpdateRole(
                            project.id,
                            member.userId,
                            Number(e.target.value) as ProjectMemberRoleType,
                          )
                        }
                      >
                        <option value={1}>ADMIN</option>
                        <option value={2}>MEMBER</option>
                      </select>
                    )}

                    {!isOwner && (
                      <button
                        className="btn btn-ghost btn-icon"
                        style={{ color: 'var(--priority-high)' }}
                        onClick={() => void onRemoveMember(project.id, member.userId)}
                        title="Xóa thành viên"
                      >
                        <Icon name="trash" size={16} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
};
