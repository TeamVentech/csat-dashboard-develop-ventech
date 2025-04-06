import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class UpdateVoucherNameCategoryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;
} 