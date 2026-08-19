import {
  Project,
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectMemberRoleType,
} from '../types/project.types';
import { INITIAL_PROJECTS, INITIAL_USERS } from './mockData';

const PROJECTS_STORAGE_KEY = 'task_manager_projects';

class ProjectService {
  private getStoredProjects(): Project[] {
    const data = localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (!data) {
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(INITIAL_PROJECTS));
      return INITIAL_PROJECTS;
    }
    return JSON.parse(data) as Project[];
  }

  private saveProjects(projects: Project[]): void {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
  }

  getProjects(): Promise<Project[]> {
    return Promise.resolve(this.getStoredProjects());
  }

  getProject(id: number): Promise<Project> {
    const projects = this.getStoredProjects();
    const project = projects.find((p) => p.id === id);
    if (!project) return Promise.reject(new Error('Không tìm thấy dự án'));
    return Promise.resolve(project);
  }

  createProject(data: CreateProjectRequest, ownerId: number): Promise<Project> {
    const projects = this.getStoredProjects();
    const owner = INITIAL_USERS.find((u) => u.id === ownerId) || INITIAL_USERS[0];
    const newProject: Project = {
      id: Date.now(),
      name: data.name,
      description: data.description,
      ownerId: owner.id,
      createdAt: new Date().toISOString(),
      owner,
      members: [
        {
          projectId: Date.now(),
          userId: owner.id,
          role: 1, // Admin / Owner
          joinedAt: new Date().toISOString(),
          user: owner,
        },
      ],
    };
    projects.push(newProject);
    this.saveProjects(projects);
    return Promise.resolve(newProject);
  }

  updateProject(id: number, data: UpdateProjectRequest): Promise<Project> {
    const projects = this.getStoredProjects();
    const index = projects.findIndex((p) => p.id === id);
    if (index === -1) return Promise.reject(new Error('Không tìm thấy dự án'));

    projects[index] = {
      ...projects[index],
      name: data.name ?? projects[index].name,
      description: data.description ?? projects[index].description,
    };
    this.saveProjects(projects);
    return Promise.resolve(projects[index]);
  }

  deleteProject(id: number): Promise<void> {
    const projects = this.getStoredProjects().filter((p) => p.id !== id);
    this.saveProjects(projects);
    return Promise.resolve();
  }

  addMember(projectId: number, userId: number, role: ProjectMemberRoleType): Promise<Project> {
    const projects = this.getStoredProjects();
    const project = projects.find((p) => p.id === projectId);
    if (!project) return Promise.reject(new Error('Dự án không tồn tại'));

    const user = INITIAL_USERS.find((u) => u.id === userId);
    if (!user) return Promise.reject(new Error('Người dùng không tồn tại'));

    if (!project.members) project.members = [];
    if (project.members.some((m) => m.userId === userId)) {
      return Promise.reject(new Error('Người dùng đã là thành viên của dự án'));
    }

    project.members.push({
      projectId,
      userId,
      role,
      joinedAt: new Date().toISOString(),
      user,
    });

    this.saveProjects(projects);
    return Promise.resolve(project);
  }

  removeMember(projectId: number, userId: number): Promise<Project> {
    const projects = this.getStoredProjects();
    const project = projects.find((p) => p.id === projectId);
    if (!project) return Promise.reject(new Error('Dự án không tồn tại'));

    if (project.ownerId === userId) {
      return Promise.reject(new Error('Không thể xóa Chủ dự án (Owner)'));
    }

    project.members = (project.members || []).filter((m) => m.userId !== userId);
    this.saveProjects(projects);
    return Promise.resolve(project);
  }

  updateMemberRole(projectId: number, userId: number, role: ProjectMemberRoleType): Promise<Project> {
    const projects = this.getStoredProjects();
    const project = projects.find((p) => p.id === projectId);
    if (!project) return Promise.reject(new Error('Dự án không tồn tại'));

    const member = (project.members || []).find((m) => m.userId === userId);
    if (!member) return Promise.reject(new Error('Thành viên không tồn tại trong dự án'));

    member.role = role;
    this.saveProjects(projects);
    return Promise.resolve(project);
  }
}

export const projectService = new ProjectService();
