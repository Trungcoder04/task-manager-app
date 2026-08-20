import { IsOptional, IsString } from 'class-validator';

export class ProjectUpdateRequestDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;
}