import { PartialType } from '@nestjs/mapped-types';
import { CreateTransactionSurveyDto } from './create.dto';

export class UpdateTransactionSurveyDto extends PartialType(CreateTransactionSurveyDto) {}
