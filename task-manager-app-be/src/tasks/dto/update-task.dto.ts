import {
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  Max,
  IsDateString,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateTaskDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  title?: string;

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
  priority?: number;

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
