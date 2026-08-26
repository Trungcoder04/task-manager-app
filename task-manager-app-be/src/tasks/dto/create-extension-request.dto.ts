import { IsDateString, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateExtensionRequestDto {
  @IsDateString({}, { message: 'Hạn chót mới phải đúng định dạng ngày tháng' })
  @IsNotEmpty({ message: 'Vui lòng chọn hạn chót mới' })
  newDueDate: string;

  @IsString({ message: 'Lý do xin gia hạn phải là chuỗi văn bản' })
  @IsNotEmpty({ message: 'Vui lòng nhập lý do xin gia hạn' })
  @MinLength(5, { message: 'Lý do xin gia hạn phải có ít nhất 5 ký tự' })
  reason: string;
}
