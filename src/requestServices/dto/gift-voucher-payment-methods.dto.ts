import { IsEnum, IsOptional, IsDateString } from 'class-validator';

export enum PeriodType {
  DAILY = 'Daily',
  WEEKLY = 'Weekly',
  MONTHLY = 'Monthly'
}

export class GiftVoucherPaymentMethodsDto {
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