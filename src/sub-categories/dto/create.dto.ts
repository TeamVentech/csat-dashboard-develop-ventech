import { IsNotEmpty, IsOptional, IsString, MaxLength, IsUUID } from 'class-validator';

export class CreateSubCategoryDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsUUID()
  categoryId: string;

  @IsNotEmpty()
  @IsUUID()
  locationId: string;
}
