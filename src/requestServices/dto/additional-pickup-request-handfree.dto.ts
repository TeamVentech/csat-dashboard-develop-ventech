import { IsString, IsNotEmpty, IsObject, IsBoolean } from 'class-validator'
import { IsDateFormat, IsTimeFormat } from 'validators/custom-date-time.decorators'

export class AdditionalPickupRequestHandfreeDto {
	@IsObject()
	@IsNotEmpty()
	location: object

	@IsString()
	@IsNotEmpty()
	@IsDateFormat()
	date: string

	@IsString()
	@IsNotEmpty()
	@IsTimeFormat()
	time: string

	@IsBoolean()
	@IsNotEmpty()
	exactlocation: boolean
}
