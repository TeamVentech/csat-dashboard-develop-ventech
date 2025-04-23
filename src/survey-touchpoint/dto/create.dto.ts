import { IsString, IsNotEmpty } from 'class-validator';

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

  @IsString()
  @IsNotEmpty()
  touchpointId: string;

  @IsString()
  @IsNotEmpty()
  qrImage: string;
} 