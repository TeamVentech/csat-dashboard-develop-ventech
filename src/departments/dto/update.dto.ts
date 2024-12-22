import { PartialType } from '@nestjs/mapped-types';
import { CreateDepartmentDto } from './create.dto';

export class UpdateDepartmentDto extends PartialType(CreateDepartmentDto) {}
