import { PartialType } from '@nestjs/mapped-types';
import { CreateVouchersDto } from './create.dto';

export class UpdateVouchersDto extends PartialType(CreateVouchersDto) {}
