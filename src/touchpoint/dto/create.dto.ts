import { IsNotEmpty, IsOptional, IsString, MaxLength, IsUUID } from 'class-validator';

export class CreateTouchPointDto {
  @IsNotEmpty()
  name: any;

  @IsOptional()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsUUID()
  categoryId: string;

}
