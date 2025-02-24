import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateComplaintServicesDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  metadata: any;

  @IsNotEmpty()
  @IsString()
  status: string;

  @IsOptional()
  customer: any;

  @IsOptional()
  tenant: any;

  @IsNotEmpty()
  category: any;

  @IsNotEmpty()
  touchpoint: any;

  @IsNotEmpty()
  @IsString()
  addedBy: string; 

  @IsNotEmpty()
  @IsString()
  type: string;

  @IsOptional()
  sections: any;
}
