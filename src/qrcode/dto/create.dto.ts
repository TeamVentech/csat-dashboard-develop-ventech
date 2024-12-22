import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateQRCodeDto {
  qr_code_identifier: string;

  subcategoryId: string;

  surveyId: string;
}
