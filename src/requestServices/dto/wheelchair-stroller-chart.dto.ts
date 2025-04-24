import { IsOptional, IsString, IsNumber, IsDateString, IsEnum } from 'class-validator';

export class WheelchairStrollerChartDto {
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;

  @IsOptional()
  @IsEnum(['Daily', 'Weekly', 'Monthly'])
  period?: string;

  @IsOptional()
  @IsString()
  @IsEnum(['Wheelchair', 'Stroller'])
  serviceType?: string;

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
} 