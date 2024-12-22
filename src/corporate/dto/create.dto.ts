import { IsString, IsEmail, IsOptional, IsDate, IsMobilePhone } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCorporateDto {
  @IsString()
  name: string;

  @IsString()
  phone_number: string;

  @IsEmail()
  email: string;


  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  age?: string;

}
