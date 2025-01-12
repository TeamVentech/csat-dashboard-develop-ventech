import { PartialType } from '@nestjs/mapped-types';
import { CreateCommentDto } from './create.dto';

export class UpdateCommentDto extends PartialType(CreateCommentDto) {}
