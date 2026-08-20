import {
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  Max,
  IsDateString,
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
  @Min(1)
  @Max(3)
  status?: number;

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
}
