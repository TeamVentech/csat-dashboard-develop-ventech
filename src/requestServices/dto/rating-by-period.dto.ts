import { IsOptional, IsDateString, IsEnum, IsString } from 'class-validator';

export enum PeriodType {
  DAILY = 'Daily',
  MONTHLY = 'Monthly',
  WEEKLY = 'Weekly'
}

export class RatingByPeriodDto {
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;

  @IsOptional()
  @IsEnum(PeriodType)
  period?: PeriodType = PeriodType.MONTHLY;

  @IsOptional()
  @IsString()
  type?: string;
} 