import { PartialType } from '@nestjs/mapped-types';
import { CreateSurveysDto } from './create.dto';

export class UpdateSurveysDto extends PartialType(CreateSurveysDto) {}
