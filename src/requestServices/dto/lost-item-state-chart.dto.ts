import { IsEnum, IsOptional, IsDateString, IsString } from 'class-validator';

export enum PeriodType {
  TIME_OF_DAY = 'TimeOfDay',
  MONTHLY = 'Monthly',
  WEEKLY = 'Weekly'
}

export class LostItemStateChartDto {
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;

  @IsOptional()
  @IsEnum(PeriodType)
  period?: PeriodType;

  @IsOptional()
  @IsString()
  type?: string;
} 