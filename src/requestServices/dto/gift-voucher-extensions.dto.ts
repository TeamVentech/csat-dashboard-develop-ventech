import { IsEnum, IsOptional, IsDateString, IsNumber, IsString } from 'class-validator';

export enum PeriodType {
  DAILY = 'Daily',
  WEEKLY = 'Weekly',
  MONTHLY = 'Monthly'
}

export class GiftVoucherExtensionsDto {
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
  typeOfSale?: string;

  @IsOptional()
  @IsNumber()
  denomination?: number;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsNumber()
  minAge?: number;

  @IsOptional()
  @IsNumber()
  maxAge?: number;

  @IsOptional()
  @IsString()
  gender?: string;
} 