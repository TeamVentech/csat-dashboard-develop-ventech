import { IsEnum, IsOptional, IsString, IsNumber, IsDateString } from 'class-validator';

export enum PeriodType {
  TIME_OF_DAY = 'TimeOfDay',
  MONTHLY = 'Monthly',
  WEEKLY = 'Weekly'
}

export class FoundChildChartDto {
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
  @IsString()
  locationId?: string;

  @IsOptional()
  @IsEnum(PeriodType)
  period?: PeriodType;
} 