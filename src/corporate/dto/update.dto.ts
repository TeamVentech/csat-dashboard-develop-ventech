import { PartialType } from '@nestjs/mapped-types';
import { CreateCorporateDto } from './create.dto';

export class UpdateCorporateDto extends PartialType(CreateCorporateDto) {}
