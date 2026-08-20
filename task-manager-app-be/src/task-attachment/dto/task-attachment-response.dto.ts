export interface TaskAttachmentUploader {
  id: number;
  username: string;
  fullName: string;
}

export class TaskAttachmentResponse {
  id: number;
  taskId: number;
  uploaderId: number;
  fileName: string;
  fileUrl: string;
  uploadedAt: Date;
  uploader?: TaskAttachmentUploader;
}
