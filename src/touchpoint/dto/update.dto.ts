import { PartialType } from '@nestjs/mapped-types';
import { CreateTouchPointDto } from './create.dto';

export class UpdateTouchPointDto extends PartialType(CreateTouchPointDto) {}
