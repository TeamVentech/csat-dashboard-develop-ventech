import { PartialType } from '@nestjs/mapped-types';
import { CreateVouchersDto } from './create.dto';
import { IsOptional } from 'class-validator';

export class UpdateVouchersDto extends PartialType(CreateVouchersDto) {
    @IsOptional()
    service_id: string

    @IsOptional()
    actions: string

    @IsOptional()
    VoucherId: string

    @IsOptional()
    newVoucher: string
    
}
