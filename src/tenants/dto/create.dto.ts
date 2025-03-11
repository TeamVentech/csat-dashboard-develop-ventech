import { IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTenantDto {
  @IsOptional()
  name: string;

  @IsOptional()
  contact_name: string;

  @IsOptional()
  email: string;

  @IsOptional()
  phone_number: string;

  @IsOptional()
  manager_account: string;

  @IsOptional()
  manager_email: string;
}
