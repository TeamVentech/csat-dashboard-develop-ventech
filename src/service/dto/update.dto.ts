import { PartialType } from '@nestjs/mapped-types';
import { CreateServicesDto } from './create.dto';

export class UpdateServicesDto extends PartialType(CreateServicesDto) {}
