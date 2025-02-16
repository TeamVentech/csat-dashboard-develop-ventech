import { PartialType } from '@nestjs/mapped-types';
import { CreateTaskDto } from './create.dto';

export class UpdateTaskServicesDto extends PartialType(CreateTaskDto) {}
