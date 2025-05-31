import { IsEnum, IsOptional, IsDateString, IsNumber } from 'class-validator';

export enum PeriodType {
  DAILY = 'Daily',
  WEEKLY = 'Weekly',
  MONTHLY = 'Monthly'
}

export class GiftVoucherDurationAfterExpiryDto {
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
  @IsNumber()
  denomination?: number;
} 