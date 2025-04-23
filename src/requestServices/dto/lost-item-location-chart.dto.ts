import { IsEnum, IsOptional, IsNumber, IsDateString, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export enum LocationType {
  LOST = 'lost',
  FOUND = 'found'
}

export class LostItemLocationChartDto {
  @IsOptional()
  @IsEnum(LocationType)
  locationType?: LocationType;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => typeof value === 'string' ? parseInt(value, 10) : value)
  minAge?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => typeof value === 'string' ? parseInt(value, 10) : value)
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