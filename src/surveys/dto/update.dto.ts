import { PartialType } from '@nestjs/mapped-types';
import { CreateSurveysDto } from './create.dto';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateSurveysDto extends PartialType(CreateSurveysDto) {}


export class UpdateSurveyDetailsDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    brief: string;

    @IsString()
    @IsNotEmpty()
    state: string;
}
