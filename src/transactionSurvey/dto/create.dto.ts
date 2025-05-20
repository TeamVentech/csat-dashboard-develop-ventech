import { IsNotEmpty, IsUUID, IsString, IsArray, ValidateNested, IsOptional } from 'class-validator'
import { Type } from 'class-transformer'

class AnswerDto {
	@IsString()
	@IsNotEmpty()
	type: string

	@IsNotEmpty()
	id: string

	@IsNotEmpty()
	answer: string | number | boolean

	@IsOptional()
	comment: string
}

export class CreateTransactionSurveyDto {
	@IsOptional()
	state: string

	@IsString()
	@IsNotEmpty()
	addedBy: string


	@IsUUID()
	@IsNotEmpty()
	surveyId: string

	@IsUUID()
	@IsNotEmpty()
	touchpointId: string

	@IsUUID()
	@IsNotEmpty()
	customerId: string

	@IsUUID()
	@IsNotEmpty()
	categoryId: string

	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => AnswerDto)
	answers: AnswerDto[]

	@IsOptional()
	rating: string

	@IsOptional()
	touchpoint: any
}
