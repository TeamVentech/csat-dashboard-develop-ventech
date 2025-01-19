import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateSectionDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  role: any;

  @IsNotEmpty()
  departmentId: string;
}
