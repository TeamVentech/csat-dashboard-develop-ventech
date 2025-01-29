import { IsString, IsEmail, IsOptional, IsDate, IsMobilePhone } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCustomerDto {
  @IsString()
  name: string;

  @IsString()
  phone_number: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dob?: Date;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  age?: string;

  @IsOptional()
  national_id?: string;

  @IsOptional()
  passport_number?: string;

}
