import { PartialType } from '@nestjs/mapped-types';
import { CreateLocationDto } from './create.dto';

export class UpdateLocationDto extends PartialType(CreateLocationDto) {}
