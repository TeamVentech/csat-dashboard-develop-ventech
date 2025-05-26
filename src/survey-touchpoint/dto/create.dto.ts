import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateSurveyTouchpointDto {
  @IsString()
  @IsNotEmpty()
  surveyId: string;

  @IsString()
  @IsNotEmpty()
  qrcodeLink: string;

  @IsString()
  @IsNotEmpty()
  touchpointName: string;

  @IsOptional()
  category: any;

  @IsString()
  @IsNotEmpty()
  touchpointId: string;

  @IsString()
  @IsNotEmpty()
  qrImage: string;
} 