export interface AssigneeResponse {
    id: number;
    username: string;
    fullName: string;
    email?: string | null;
    avatar?: string | null;
}

export interface TaskActivityUserResponse {
    id: number;
    username: string;
    fullName: string;
    avatar?: string | null;
}

export interface TaskActivityResponse {
    id: number;
    taskId: number;
    userId: number;
    action: string;
    createdAt: Date;
    user?: TaskActivityUserResponse;
}

export interface TaskResponse {
    id: number;
    projectId: number;
    title: string;
    description: string | null;
    status: number;
    priority: number;
    dueDate: Date | null;
    assigneeId?: number | null;
    assignee?: AssigneeResponse | null;
    assignerId?: number | null;
    assigner?: AssigneeResponse | null;
    createdById?: number | null;
    createdBy?: AssigneeResponse | null;
    orderIndex: number;
    createdAt: Date;
    activities?: TaskActivityResponse[];
    comments?: any[];
    attachments?: any[];
    labels?: any[];
    _count?: {
        comments?: number;
        attachments?: number;
        activities?: number;
    };
}