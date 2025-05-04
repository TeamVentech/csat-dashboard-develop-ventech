import { IsOptional, IsDateString } from 'class-validator';

export class GiftVoucherCorporateSpendersDto {
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;
} 