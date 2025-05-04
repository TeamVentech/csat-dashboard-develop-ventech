import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateMessageDto {
  @IsNotEmpty()
  @IsString()
  content_ar: string;

  @IsNotEmpty()
  @IsString()
  content_en: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

} 