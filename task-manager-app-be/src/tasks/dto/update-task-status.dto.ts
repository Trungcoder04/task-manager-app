import { IsInt, IsNotEmpty, IsOptional, IsString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateTaskStatusDto {
  @IsNotEmpty({ message: 'Trạng thái mới không được để trống' })
  @Type(() => Number)
  @IsInt({ message: 'Trạng thái phải là số nguyên' })
  @Min(0, { message: 'Trạng thái không hợp lệ' })
  @Max(5, { message: 'Trạng thái không hợp lệ' })
  status: number;

  @IsOptional()
  @IsString()
  note?: string; 
}
