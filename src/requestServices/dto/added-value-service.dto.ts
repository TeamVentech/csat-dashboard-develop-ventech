import { IsString, IsBoolean, IsObject, ValidateNested, IsDateString, IsEnum, IsDate, IsNotEmpty, IsOptional, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';

class CustomerDto {
  @IsString()
  @IsNotEmpty()
  national_id: string;

  @IsString()
  @IsNotEmpty()
  passport_number: string;

  @IsString()
  @IsNotEmpty()
  phone_number: string;

  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  age: string;

  @IsString()
  @IsNotEmpty()
  email: string;

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  dob: Date;

  @IsString()
  @IsNotEmpty()
  gender: string;

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  createdAt: Date;

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  updatedAt: Date;
}

class LocationDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  floor: string;

  @IsString()
  @IsNotEmpty()
  tenant: string;
}

class ActionsDto {
  @IsBoolean()
  @IsNotEmpty()
  custoemr_collect: boolean;
}

class MetadataDto {
  @IsBoolean()
  @IsNotEmpty()
  IsArabic: boolean;

  @ValidateNested()
  @Type(() => CustomerDto)
  @IsNotEmpty()
  customer: CustomerDto;

  @IsBoolean()
  @IsNotEmpty()
  delivery: boolean;

  @IsBoolean()
  @IsNotEmpty()
  pickUp: boolean;

  @IsString()
  @IsNotEmpty()
  request_source: string;

  @ValidateIf(o => o.delivery === true)
  @IsDateString()
  @IsNotEmpty()
  deliveryDate?: string;

  @ValidateIf(o => o.delivery === true)
  @IsString()
  @IsNotEmpty()
  deliveryTime?: string;

  @ValidateIf(o => o.delivery === true)
  @IsBoolean()
  @IsNotEmpty()
  ExactDeliveryLocation?: boolean;

  @ValidateIf(o => o.delivery === true)
  @ValidateNested()
  @Type(() => LocationDto)
  @IsNotEmpty()
  deliveryLocation?: LocationDto;

  @ValidateIf(o => o.pickUp === true)
  @IsDateString()
  @IsNotEmpty()
  pickupDate?: string;

  @ValidateIf(o => o.pickUp === true)
  @IsString()
  @IsNotEmpty()
  pickupTime?: string;

  @ValidateIf(o => o.pickUp === true)
  @IsBoolean()
  @IsNotEmpty()
  ExactPickupLocation?: boolean;

  @ValidateIf(o => o.pickUp === true)
  @ValidateNested()
  @Type(() => LocationDto)
  @IsNotEmpty()
  pickupLocation?: LocationDto;

  @IsEnum(['Wheelchair', 'Stroller'])
  @IsOptional()
  type: string;

  @ValidateNested()
  @Type(() => ActionsDto)
  @IsNotEmpty()
  actions: ActionsDto;

  @IsObject()
  @IsOptional()
  service?: any;
}

export class AddedValueServiceDto {
  @IsEnum(['Wheelchair & Stroller Request', 'Power Bank Request'])
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsNotEmpty()
  addedBy: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @ValidateNested()
  @Type(() => MetadataDto)
  @IsNotEmpty()
  metadata: MetadataDto;
} 