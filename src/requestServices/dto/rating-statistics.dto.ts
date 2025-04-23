import { IsOptional, IsDateString, IsString } from 'class-validator';

export class RatingStatisticsDto {
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;

  @IsOptional()
  @IsString()
  type?: string;
} 