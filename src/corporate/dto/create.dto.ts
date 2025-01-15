import { IsString, IsEmail, IsOptional, IsDate, IsMobilePhone } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCorporateDto {
  @IsString()
  name: string;

  @IsOptional()
  phone_number: string;

  @IsOptional()
  email: string;

  @IsOptional()
  contact_name?: string;
}
