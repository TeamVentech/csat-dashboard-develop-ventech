import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateMessageDto {
  @IsOptional()
  @IsString()
  content_ar?: string;

  @IsOptional()
  @IsString()
  content_en?: string;


  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

} 