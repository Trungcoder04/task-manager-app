import { User } from './user.types';

export interface TaskAttachment {
  id: number;
  taskId: number;
  uploaderId: number;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
  uploader?: User;
}

export interface CreateAttachmentRequest {
  taskId: number;
  fileName: string;
  fileUrl: string;
}
