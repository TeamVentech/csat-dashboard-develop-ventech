import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateServicesDto {
  @IsNotEmpty()
  type: any;

  @IsNotEmpty()
  @IsString()
  status: string;

  @IsNotEmpty()
  @IsString()
  addedBy: string; 
}
