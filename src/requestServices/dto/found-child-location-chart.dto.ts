import { IsEnum, IsOptional, IsNumber, IsDateString, IsString } from 'class-validator';

export enum LocationType {
  LOST = 'lost',
  FOUND = 'found'
}

export class FoundChildLocationChartDto {
  @IsOptional()
  @IsEnum(LocationType)
  locationType?: LocationType;

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
} 