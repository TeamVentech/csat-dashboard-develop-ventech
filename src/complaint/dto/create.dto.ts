import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateComplaintServicesDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  metadata: any;

  @IsNotEmpty()
  @IsString()
  state: string;

  @IsUUID()
  @IsNotEmpty()
  customerId: string;

  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @IsUUID()
  @IsNotEmpty()
  touchpointId: string;

  
  @IsNotEmpty()
  @IsString()
  addedBy: string; 

  @IsNotEmpty()
  @IsString()
  type: string;
}
