import { PartialType } from '@nestjs/mapped-types';
import { CreateTenantDto } from './create.dto';

export class UpdateTenantDto extends PartialType(CreateTenantDto) {}
