import { PartialType } from '@nestjs/mapped-types';
import { CreateComplaintCategoryDto } from './create.dto';

export class UpdateComplaintCategoryDto extends PartialType(CreateComplaintCategoryDto) {}
