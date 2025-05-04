import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export enum PeriodType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  HOURLY = 'hourly'
}

export class TransactionReportDto {
  @IsOptional()
  @IsString()
  fromDate?: string;

  @IsOptional()
  @IsString()
  toDate?: string;

  @IsOptional()
  @IsEnum(PeriodType)
  period: PeriodType = PeriodType.DAILY;

  @IsOptional()
  minAge?: string | number;

  @IsOptional()
  maxAge?: string | number;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsUUID()
  touchpointId?: string;

  @IsOptional()
  @IsUUID()
  surveyId?: string;

  @IsOptional()
  @IsString()
  questionsSection?: string;
} 