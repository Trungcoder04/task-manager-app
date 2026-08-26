export enum TaskStatus {
  PENDING = 0,     // Chờ duyệt
  TODO = 1,        // Cần làm
  IN_PROGRESS = 2, // Đang thực hiện
  IN_REVIEW = 3,   // Chờ nghiệm thu
  DONE = 4,        // Đã hoàn thành
  REJECTED = 5,    // Bị từ chối / Hủy
}

export const TaskStatusName: Record<number, string> = {
  [TaskStatus.PENDING]: 'PENDING (Chờ duyệt)',
  [TaskStatus.TODO]: 'TODO (Cần làm)',
  [TaskStatus.IN_PROGRESS]: 'IN_PROGRESS (Đang làm)',
  [TaskStatus.IN_REVIEW]: 'IN_REVIEW (Chờ nghiệm thu)',
  [TaskStatus.DONE]: 'DONE (Hoàn thành)',
  [TaskStatus.REJECTED]: 'REJECTED (Bị từ chối)',
};

export enum ProjectRole {
  ADMIN = 1,
  LEAD = 2,
  MEMBER = 3,
}
