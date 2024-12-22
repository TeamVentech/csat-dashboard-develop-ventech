import { PartialType } from '@nestjs/mapped-types';
import { CreateQRCodeDto } from './create.dto';

export class UpdateQRCodeDto extends PartialType(CreateQRCodeDto) {}
