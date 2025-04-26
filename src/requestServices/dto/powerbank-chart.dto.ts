import { IsOptional, IsString, IsNumber, IsDateString, IsEnum } from 'class-validator';

export class PowerBankChartDto {
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;

  @IsOptional()
  @IsEnum(['Daily', 'Weekly', 'Monthly'])
  period?: string = 'Monthly';

  @IsOptional()
  @IsNumber()
  minAge?: number;

  @IsOptional()
  @IsNumber()
  maxAge?: number;

  @IsOptional()
  @IsString()
  @IsEnum(['Male', 'Female'])
  gender?: string;

  @IsOptional()
  @IsString()
  @IsEnum(['QR Code', 'Hotline', 'CC Desk'])
  requestSource?: string;
} 