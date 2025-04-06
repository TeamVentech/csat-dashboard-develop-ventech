import { AbilityDto } from './ability.dto';

export class UpdateRoleDto {
    name?: string;
    description?: string;
    ability?: AbilityDto[];
}
  