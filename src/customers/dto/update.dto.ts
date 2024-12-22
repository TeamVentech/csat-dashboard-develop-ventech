import { PartialType } from '@nestjs/mapped-types';
import { CreateCustomerDto } from './create.dto';

export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {}
