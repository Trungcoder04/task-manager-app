import { IsInt, IsOptional, IsString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class TaskQueryDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  @Max(3)
  status?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  @Max(3)
  priority?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  assigneeId?: number;

  @IsOptional()
  @IsString()
  search?: string;
}
