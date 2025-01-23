import { PartialType } from '@nestjs/mapped-types';
import { CreateRequestServicesDto } from './create.dto';
import { IsOptional } from 'class-validator';

export class UpdateRequestServicesDto extends PartialType(CreateRequestServicesDto) {
    @IsOptional()
    actions: string;
}
