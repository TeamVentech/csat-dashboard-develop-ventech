import { PartialType } from '@nestjs/mapped-types';
import { CreateTaskDto } from './create.dto';
import { IsOptional } from 'class-validator';

export class UpdateTaskServicesDto extends PartialType(CreateTaskDto) {
    @IsOptional()
    action_role: string;

    @IsOptional()
    complaints: any;

    @IsOptional()
    complaint_type: any;
}
