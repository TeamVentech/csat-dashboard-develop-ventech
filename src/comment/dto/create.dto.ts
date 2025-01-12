import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @IsUUID()
  @IsNotEmpty()
  customerId: string;

  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @IsUUID()
  @IsNotEmpty()
  touchpointId: string;

  @IsUUID()
  @IsNotEmpty()
  surveyId: string;

  @IsNotEmpty()
  touchpointName: any;

  @IsString()
  @IsNotEmpty()
  status: string;

  @IsString()
  @IsOptional()
  message?: string;

  @IsString()
  @IsOptional()
  type?: string;
  
  @IsOptional()
  metadata: any;

}
