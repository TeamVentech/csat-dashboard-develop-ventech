import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @IsNotEmpty()
  name: any;

  @IsOptional()
  description: string;

  @IsNotEmpty()
  type: string;
}
