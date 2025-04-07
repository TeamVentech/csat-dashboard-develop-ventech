import { IsString, MinLength, IsNotEmpty } from 'class-validator';

export class ChangePasswordDto {

  @IsString()
  @MinLength(6)
  newPassword: string;

  @IsString()
  @MinLength(6)
  confirmPassword: string;

  @IsString()
  @IsNotEmpty()
  userId: string;
}
