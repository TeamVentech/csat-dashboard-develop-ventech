import { IsString, IsEmail, IsOptional, IsDate, IsMobilePhone, Matches } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCustomerDto {
  @IsString()
  @IsOptional()
  name: string;

  @IsString()
  phone_number: string;

  @IsEmail()
  @IsOptional()
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
