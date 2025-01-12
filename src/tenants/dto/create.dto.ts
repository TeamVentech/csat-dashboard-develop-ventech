import { IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTenantDto {
  @IsString()
  name: string;

  @IsString()
  manager_name: string;

  @IsString()
  manager_email: string;

}
