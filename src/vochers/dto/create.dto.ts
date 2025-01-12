import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateVouchersDto {
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
  serialNumber: string;
}
