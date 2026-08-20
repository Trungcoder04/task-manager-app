import { IsInt, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class ProjectMemberRequestDto {
  @IsInt()
  @IsOptional() // Có thể optional vì khi update role thì không cần truyền userId
  userId?: number;

  @IsNumber()
  @IsNotEmpty({ message: 'Role không được để trống' })
  role: number;
}