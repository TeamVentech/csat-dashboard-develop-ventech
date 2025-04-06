import { PartialType } from '@nestjs/mapped-types';
import { CreateSurveyTouchpointDto } from './create.dto';

export class UpdateSurveyTouchpointDto extends PartialType(CreateSurveyTouchpointDto) {} 