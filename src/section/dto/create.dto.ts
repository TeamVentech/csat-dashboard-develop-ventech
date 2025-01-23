import { IsArray, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateSectionDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsArray()
  @IsString({ each: true })
  role: string[];

  @IsNotEmpty()
  departmentId: string;
}
