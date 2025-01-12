import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateRequestServicesDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  metadata: any;

  @IsNotEmpty()
  @IsString()
  state: string;

  
  @IsNotEmpty()
  @IsString()
  addedBy: string; 

  @IsNotEmpty()
  @IsString()
  type: string;

  @IsOptional()
  rating: string;

}
