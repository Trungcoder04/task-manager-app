import { IsNotEmpty, IsString } from 'class-validator';

export class CreateLabelDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên nhãn không được để trống' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Mã màu không được để trống' })
  colorCode: string;
}