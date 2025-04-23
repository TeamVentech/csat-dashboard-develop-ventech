import { IsEnum, IsOptional, IsNumber, IsDateString, IsString } from 'class-validator';

export enum PeriodType {
  TIME_OF_DAY = 'TimeOfDay',
  MONTHLY = 'Monthly',
  WEEKLY = 'Weekly'
}

export class LostChildDurationDto {
  @IsOptional()
  @IsNumber()
  minAge?: number;

  @IsOptional()
  @IsNumber()
  maxAge?: number;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;

  @IsOptional()
  @IsEnum(PeriodType)
  period?: PeriodType;
} 