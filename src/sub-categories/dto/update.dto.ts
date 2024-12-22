import { PartialType } from '@nestjs/mapped-types';
import { CreateSubCategoryDto } from './create.dto';

export class UpdateSubCategoryDto extends PartialType(CreateSubCategoryDto) {}
