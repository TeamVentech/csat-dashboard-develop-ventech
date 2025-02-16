import { IsNotEmpty, IsOptional, IsString, MaxLength, IsUUID } from 'class-validator';

export class CreateTouchPointDto {
  @IsNotEmpty()
  name: any;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  workflow: any;

  @IsNotEmpty()
  @IsUUID()
  categoryId: string;

}
