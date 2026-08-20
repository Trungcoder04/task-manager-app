export interface AssigneeResponse {
    id: number;
    username: string;
    fullName: string;
    email?: string | null;
}

export interface TaskResponse {
    id: number;
    projectId: number;
    title: string;
    description: string | null;
    status: number;
    priority: number;
    dueDate: Date | null;
    assignee?: AssigneeResponse | null;
    orderIndex: number;
    createdAt: Date;
}