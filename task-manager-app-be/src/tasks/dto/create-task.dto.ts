import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  Max,
  IsDateString,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTaskDto {
  @IsInt()
  @IsNotEmpty()
  projectId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(5)
  status?: number; // 0: PENDING, 1: TODO, 2: IN_PROGRESS, 3: IN_REVIEW, 4: DONE, 5: REJECTED

  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(3)
  priority?: number; // 1: Low, 2: Medium, 3: High

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsInt()
  @IsOptional()
  assigneeId?: number;

  @IsOptional()
  @Type(() => Number)
  orderIndex?: number;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  labelIds?: number[];
}
