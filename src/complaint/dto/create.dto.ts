import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateComplaintServicesDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  metadata: any;

  @IsNotEmpty()
  @IsString()
  status: string;

  @IsNotEmpty()
  customer: any;

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

  @IsNotEmpty()
  sections: any;
}
