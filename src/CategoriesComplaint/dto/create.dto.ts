import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateComplaintCategoryDto {
  @IsNotEmpty()
  name: any;
}
