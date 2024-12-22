import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateSectionDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  role: string;

  @IsNotEmpty()
  @IsString()
  department: string;
}
