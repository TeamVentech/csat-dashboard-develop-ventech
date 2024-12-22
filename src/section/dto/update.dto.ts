import { PartialType } from '@nestjs/mapped-types';
import { CreateSectionDto } from './create.dto';

export class UpdateSectionDto extends PartialType(CreateSectionDto) {}
