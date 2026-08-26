import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ReviewExtensionRequestDto {
  @IsInt({ message: 'Trạng thái phê duyệt không hợp lệ' })
  @Min(1, { message: 'Trạng thái phải là 1 (Chấp thuận) hoặc 2 (Từ chối)' })
  @Max(2, { message: 'Trạng thái phải là 1 (Chấp thuận) hoặc 2 (Từ chối)' })
  status: number; // 1: APPROVED, 2: REJECTED

  @IsString({ message: 'Ghi chú phản hồi phải là chuỗi văn bản' })
  @IsOptional()
  reviewNote?: string;
}
