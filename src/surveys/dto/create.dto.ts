import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateSurveysDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  metadata: string;


  @IsNotEmpty()
  @IsString()
  state: string;


  @IsNotEmpty()
  @IsString()
  type: string;


  @IsNotEmpty()
  @IsString()
  brief: string;


  @IsNotEmpty()
  @IsString()
  subcategoryId: string;
}
