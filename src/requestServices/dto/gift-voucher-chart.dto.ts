import { IsEnum, IsOptional, IsString, IsNumber, IsDateString } from 'class-validator';

export enum PeriodType {
  DAILY = 'Daily',
  WEEKLY = 'Weekly',
  MONTHLY = 'Monthly'
}

export enum TypeOfSaleEnum {
  CORPORATE = 'Corporate',
  INDIVIDUAL = 'Individual'
}

export class GiftVoucherChartDto {
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

  @IsOptional()
  typeOfSale: string;

  @IsOptional()
  @IsString()
  occasion?: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsNumber()
  age?: number;

  @IsOptional()
  @IsString()
  gender?: string;
} 