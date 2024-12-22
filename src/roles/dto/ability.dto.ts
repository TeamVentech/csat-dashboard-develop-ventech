import { IsEnum } from 'class-validator';
import { AbilityActions } from '../../enums/ability-actions.enum';
import { AbilitySubjects } from '../../enums/ability-subjects.enum';

export class AbilityDto {
  @IsEnum(AbilityActions)
  action: string;

  @IsEnum(AbilitySubjects)
  subject: string;
}