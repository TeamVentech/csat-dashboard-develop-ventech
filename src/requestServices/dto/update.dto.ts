import { PartialType } from '@nestjs/mapped-types';
import { CreateRequestServicesDto } from './create.dto';

export class UpdateRequestServicesDto extends PartialType(CreateRequestServicesDto) {}
