import { PartialType } from '@nestjs/mapped-types';
import { CreateComplaintServicesDto } from './create.dto';

export class UpdateComplaintServicesDto extends PartialType(CreateComplaintServicesDto) {}
