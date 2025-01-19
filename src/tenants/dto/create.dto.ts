import { IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTenantDto {
  @IsString()
  name: string;

  @IsString()
  contact_name: string;

  @IsString()
  email: string;

  @IsString()
  phone_number: string;
}
