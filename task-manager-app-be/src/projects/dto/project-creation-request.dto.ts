import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ProjectCreationRequestDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên dự án không được để trống' })
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}