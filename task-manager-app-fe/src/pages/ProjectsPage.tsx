import React, { useState } from 'react';
import { Project, CreateProjectRequest, UpdateProjectRequest, ProjectMemberRoleType } from '../types/project.types';
import { ProjectCard } from '../components/projects/ProjectCard';
import { ProjectModal } from '../components/projects/ProjectModal';
import { MemberManagementModal } from '../components/projects/MemberManagementModal';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';

interface ProjectsPageProps {
  projects: Project[];
  activeProject: Project | null;
  isLoading: boolean;
  error: string | null;
  onSelectProject: (project: Project) => void;
  onCreateProject: (data: CreateProjectRequest) => Promise<unknown>;
  onUpdateProject: (id: number, data: UpdateProjectRequest) => Promise<unknown>;
  onDeleteProject: (id: number) => Promise<void>;
  onAddMember: (projectId: number, userId: number, role: ProjectMemberRoleType) => Promise<void>;
  onRemoveMember: (projectId: number, userId: number) => Promise<void>;
  onUpdateRole: (projectId: number, userId: number, role: ProjectMemberRoleType) => Promise<void>;
  onOpenBoard: () => void;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({
  projects,
  activeProject,
  isLoading,
  error,
  onSelectProject,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
  onAddMember,
  onRemoveMember,
  onUpdateRole,
  onOpenBoard,
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [managingMembersProject, setManagingMembersProject] = useState<Project | null>(null);

  if (isLoading) {
    return <LoadingSpinner text="Đang tải danh sách dự án..." />;
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ color: 'var(--priority-high)', marginBottom: '1rem', fontWeight: 600 }}>
          {error}
        </div>
        <Button variant="secondary" onClick={() => window.location.reload()}>
          Thử lại
        </Button>
      </div>
    );
  }

  const handleCreateSubmit = async (data: CreateProjectRequest | UpdateProjectRequest) => {
    if (editingProject) {
      await onUpdateProject(editingProject.id, data);
    } else {
      await onCreateProject(data as CreateProjectRequest);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Quản lý Dự án</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Danh sách các dự án bạn đang làm chủ (Owner) hoặc tham gia với tư cách thành viên.
          </p>
        </div>

        <Button
          variant="primary"
          icon="plus"
          onClick={() => {
            setEditingProject(null);
            setIsCreateModalOpen(true);
          }}
        >
          Tạo Dự án Mới
        </Button>
      </div>

      {/* Projects Grid or Empty State */}
      {projects.length === 0 ? (
        <EmptyState
          icon="folder"
          title="Chưa có dự án nào"
          description="Bắt đầu bằng cách tạo dự án đầu tiên của bạn để phân công và theo dõi công việc."
          action={
            <Button
              variant="primary"
              icon="plus"
              onClick={() => {
                setEditingProject(null);
                setIsCreateModalOpen(true);
              }}
            >
              Tạo dự án mới
            </Button>
          }
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              isActive={activeProject?.id === project.id}
              onSelect={(p) => {
                onSelectProject(p);
                onOpenBoard();
              }}
              onEdit={(p) => {
                setEditingProject(p);
                setIsCreateModalOpen(true);
              }}
              onDelete={onDeleteProject}
              onManageMembers={(p) => setManagingMembersProject(p)}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Project Modal */}
      <ProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateSubmit}
        project={editingProject}
      />

      {/* Member Management Modal */}
      <MemberManagementModal
        isOpen={!!managingMembersProject}
        onClose={() => setManagingMembersProject(null)}
        project={managingMembersProject}
        onAddMember={onAddMember}
        onRemoveMember={onRemoveMember}
        onUpdateRole={onUpdateRole}
      />
    </div>
  );
};
