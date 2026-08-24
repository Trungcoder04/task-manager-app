export interface ErrorCodeDetail {
  code: number;
  message: string;
  statusCode: number;
}

export const ErrorCode = {
  UNCATEGORIZED_EXCEPTION: {
    code: 9999,
    message: 'Đã có lỗi xảy ra trên hệ thống',
    statusCode: 500,
  },
  INVALID_KEY: {
    code: 1001,
    message: 'Tham số yêu cầu không hợp lệ',
    statusCode: 400,
  },
  USER_EXISTED: {
    code: 1002,
    message: 'Tên đăng nhập đã tồn tại trên hệ thống',
    statusCode: 400,
  },
  USERNAME_INVALID: {
    code: 1003,
    message: 'Tên đăng nhập phải có ít nhất {min} ký tự',
    statusCode: 400,
  },
  INVALID_PASSWORD: {
    code: 1004,
    message: 'Mật khẩu phải có ít nhất {min} ký tự',
    statusCode: 400,
  },
  USER_NOT_EXISTED: {
    code: 1005,
    message: 'Tài khoản không tồn tại trên hệ thống',
    statusCode: 404,
  },
  UNAUTHENTICATED: {
    code: 1006,
    message: 'Tài khoản chưa xác thực',
    statusCode: 401,
  },
  UNAUTHORIZED: {
    code: 1007,
    message: 'Bạn không có quyền thực hiện thao tác này',
    statusCode: 403,
  },
  EMAIL_EXISTED: {
    code: 1008,
    message: 'Địa chỉ email này đã được sử dụng',
    statusCode: 400,
  },
  INVALID_EMAIL: {
    code: 1009,
    message: 'Địa chỉ email không đúng định dạng',
    statusCode: 400,
  },

  PROJECT_NOT_FOUND: {
    code: 1010,
    message: "Dự án không tồn tại trên hệ thống",
    statusCode: 404,
  },

  TASK_NOT_FOUND: {
    code: 1011,
    message: "Công việc không tồn tại trên hệ thống",
    statusCode: 404,
  },

  ASSIGNEE_NOT_IN_PROJECT: {
    code: 1012,
    message: "Người được giao việc không phải là thành viên của dự án",
    statusCode: 400,
  },

  NOT_PROJECT_MEMBER: {
    code: 1013,
    message: "Bạn không phải là thành viên của dự án",
    statusCode: 403,
  },

  WRONG_OLD_PASSWORD: {
    code: 1010,
    message: 'Password cũ sai',
    statusCode: 400,
  },
  TASK_NOT_EXISTED: {
    code: 1011,
    message: 'Không tìm thấy công việc',
    statusCode: 404,
  },
  FILE_REQUIRED: {
    code: 1012,
    message: 'Vui lòng chọn tệp đính kèm',
    statusCode: 400,
  },
  ATTACHMENT_NOT_FOUND: {
    code: 1013,
    message: 'Không tìm thấy tệp đính kèm',
    statusCode: 404,
  },
  ACCOUNT_LOCKED: {
    code: 1014,
    message: 'Tài khoản của bạn hiện đang bị khóa. Vui lòng liên hệ Quản trị viên!',
    statusCode: 403,
  },
  ACCOUNT_DISABLED: {
    code: 1015,
    message: 'Tài khoản của bạn đã bị vô hiệu hóa.',
    statusCode: 403,
  },
  FORBIDDEN_TRANSITION: {
    code: 1020,
    message: 'Bạn không có quyền thực hiện chuyển đổi trạng thái này',
    statusCode: 403,
  },
  INVALID_STATUS_TRANSITION: {
    code: 1021,
    message: 'Không thể chuyển đổi trạng thái từ {from} sang {to}',
    statusCode: 400,
  },
  TASK_MUST_BE_PENDING_FOR_MEMBER: {
    code: 1022,
    message: 'Thành viên (Member) chỉ được phép tạo công việc ở trạng thái PENDING',
    statusCode: 400,
  },
} as const;



export type ErrorCodeKey = keyof typeof ErrorCode;
