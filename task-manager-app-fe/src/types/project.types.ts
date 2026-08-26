import { User } from './user.types';

export const ProjectMemberRole = {
  ADMIN: 1,
  LEAD: 2,
  MEMBER: 3,
} as const;

export type ProjectMemberRoleType = (typeof ProjectMemberRole)[keyof typeof ProjectMemberRole];

export interface ProjectMember {
  projectId: number;
  userId: number;
  role: ProjectMemberRoleType;
  joinedAt: string;
  user?: User;
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  ownerId: number;
  createdAt: string;
  owner?: User;
  members?: ProjectMember[];
  taskCount?: number;
  completedTaskCount?: number;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
}

export interface AddProjectMemberRequest {
  userId: number;
  role: ProjectMemberRoleType;
}
