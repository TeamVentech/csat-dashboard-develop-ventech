import { IsNotEmpty, IsOptional, IsString, MaxLength, IsUUID } from 'class-validator';

export class CreateTouchPointDto {
  @IsNotEmpty()
  name_ar: any;

  @IsNotEmpty()
  name_en: any;

  @IsOptional()
  name: any;

  @IsOptional()
  avatar: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  workflow: any;

  @IsNotEmpty()
  @IsUUID()
  categoryId: string;

}
