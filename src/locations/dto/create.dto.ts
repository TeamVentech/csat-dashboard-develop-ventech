import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateLocationDto {
  @IsNotEmpty()
  @IsString()
  floor: string;

  @IsNotEmpty()
  @IsString()
  tenant: string;
}
