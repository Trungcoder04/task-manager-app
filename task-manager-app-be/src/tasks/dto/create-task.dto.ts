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
  @Min(1)
  @Max(3)
  status?: number; // 1: Todo, 2: Doing, 3: Done

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
