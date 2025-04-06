import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @IsNotEmpty()
  name_ar: any;

  @IsNotEmpty()
  name_en: any;

  @IsOptional()
  name: any;

  @IsOptional()
  description: string;

  @IsOptional()
  species: string;

  @IsNotEmpty()
  type: string;

  @IsOptional()
  avatar: string;

  @IsOptional()
  complaint_type: string;
  }
