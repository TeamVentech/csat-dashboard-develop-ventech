import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator'

export function IsDateFormat(validationOptions?: ValidationOptions) {
	return function(object: object, propertyName: string) {
		registerDecorator({
			name: 'isDateFormat',
			target: object.constructor,
			propertyName: propertyName,
			options: validationOptions,
			validator: {
				validate(value: any) {
					const dateRegex = /^\d{4}-\d{2}-\d{2}$/
					return typeof value === 'string' && dateRegex.test(value)
				},
				defaultMessage(args: ValidationArguments) {
					return `${args.property} must be in the format YYYY-MM-DD`
				},
			},
		})
	}
}

export function IsTimeFormat(validationOptions?: ValidationOptions) {
	return function(object: object, propertyName: string) {
		registerDecorator({
			name: 'isTimeFormat',
			target: object.constructor,
			propertyName: propertyName,
			options: validationOptions,
			validator: {
				validate(value: any) {
					const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/
					return typeof value === 'string' && timeRegex.test(value)
				},
				defaultMessage(args: ValidationArguments) {
					return `${args.property} must be in the format HH:mm (24-hour format)`
				},
			},
		})
	}
}
