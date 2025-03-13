import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateVouchersDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  metadata: any;

  @IsOptional()
  @IsString()
  state: string;

  
  @IsNotEmpty()
  @IsString()
  addedBy: string; 

  @IsNotEmpty()
  @IsString()
  serialNumber: string;
}
