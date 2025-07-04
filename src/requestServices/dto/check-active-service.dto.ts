import { IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class CheckActiveServiceDto {
	@IsNotEmpty()
	@IsString()
	type: string

	@IsNotEmpty()
	@IsString()
	phoneNumber: string

	@IsOptional()
	@IsString()
	subtype: string
}
