import { IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AbilityDto } from './ability.dto';

export class CreateRoleDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => AbilityDto)
  ability: AbilityDto[];
}