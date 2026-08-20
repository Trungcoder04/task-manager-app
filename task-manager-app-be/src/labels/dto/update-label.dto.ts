import { IsOptional, IsString } from 'class-validator';

export class UpdateLabelDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  colorCode?: string;
}