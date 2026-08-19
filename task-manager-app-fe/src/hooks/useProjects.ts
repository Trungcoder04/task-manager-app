import { useState, useEffect, useCallback } from 'react';
import { Project, CreateProjectRequest, UpdateProjectRequest, ProjectMemberRoleType } from '../types/project.types';
import { projectService } from '../services/projectService';
import { useToast } from './useToast';

export const useProjects = (ownerId?: number) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await projectService.getProjects();
      setProjects(data);
      if (data.length > 0) {
        // Set first project as active if none is active or active was deleted
        setActiveProject((prev) => {
          if (!prev) return data[0];
          const exists = data.find((p) => p.id === prev.id);
          return exists || data[0];
        });
      } else {
        setActiveProject(null);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không tải được danh sách dự án';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void fetchProjects();
  }, [fetchProjects]);

  const createProject = async (data: CreateProjectRequest) => {
    try {
      const newProj = await projectService.createProject(data, ownerId || 1);
      setProjects((prev) => [...prev, newProj]);
      setActiveProject(newProj);
      showToast('Tạo dự án thành công!', 'success');
      return newProj;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Tạo dự án thất bại';
      showToast(msg, 'error');
      throw err;
    }
  };

  const updateProject = async (id: number, data: UpdateProjectRequest) => {
    try {
      const updated = await projectService.updateProject(id, data);
      setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)));
      if (activeProject?.id === id) {
        setActiveProject(updated);
      }
      showToast('Cập nhật dự án thành công!', 'success');
      return updated;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Cập nhật thất bại';
      showToast(msg, 'error');
      throw err;
    }
  };

  const deleteProject = async (id: number) => {
    try {
      await projectService.deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      if (activeProject?.id === id) {
        const remaining = projects.filter((p) => p.id !== id);
        setActiveProject(remaining.length > 0 ? remaining[0] : null);
      }
      showToast('Đã xóa dự án!', 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Xóa dự án thất bại';
      showToast(msg, 'error');
      throw err;
    }
  };

  const addMember = async (projectId: number, userId: number, role: ProjectMemberRoleType) => {
    try {
      const updated = await projectService.addMember(projectId, userId, role);
      setProjects((prev) => prev.map((p) => (p.id === projectId ? updated : p)));
      if (activeProject?.id === projectId) {
        setActiveProject(updated);
      }
      showToast('Thêm thành viên thành công!', 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Thêm thành viên thất bại';
      showToast(msg, 'error');
      throw err;
    }
  };

  const removeMember = async (projectId: number, userId: number) => {
    try {
      const updated = await projectService.removeMember(projectId, userId);
      setProjects((prev) => prev.map((p) => (p.id === projectId ? updated : p)));
      if (activeProject?.id === projectId) {
        setActiveProject(updated);
      }
      showToast('Đã xóa thành viên khỏi dự án!', 'info');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Xóa thành viên thất bại';
      showToast(msg, 'error');
      throw err;
    }
  };

  const updateMemberRole = async (projectId: number, userId: number, role: ProjectMemberRoleType) => {
    try {
      const updated = await projectService.updateMemberRole(projectId, userId, role);
      setProjects((prev) => prev.map((p) => (p.id === projectId ? updated : p)));
      if (activeProject?.id === projectId) {
        setActiveProject(updated);
      }
      showToast('Cập nhật vai trò thành công!', 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Cập nhật vai trò thất bại';
      showToast(msg, 'error');
      throw err;
    }
  };

  return {
    projects,
    activeProject,
    setActiveProject,
    isLoading,
    error,
    refreshProjects: fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    addMember,
    removeMember,
    updateMemberRole,
  };
};
