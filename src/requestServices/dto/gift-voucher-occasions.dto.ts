import { IsOptional, IsDateString } from 'class-validator';

export class GiftVoucherOccasionsDto {
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;
} 