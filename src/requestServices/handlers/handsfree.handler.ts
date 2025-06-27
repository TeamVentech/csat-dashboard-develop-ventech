import { Injectable } from '@nestjs/common'
import { UpdateRequestServicesDto } from '../dto/update.dto'
import SmsMessage from '../messages/smsMessages'
import { SmsService } from 'sms/sms.service'

@Injectable()
export class HandsfreeHandler {
	constructor(
		private readonly smsService: SmsService,
	) {
	}

	async handleHandsfreeRequest(updateRequestServicesDto: UpdateRequestServicesDto, id: string) {
		const { actions, metadata } = updateRequestServicesDto
		const numbers = metadata?.customer?.phone_number
		const language = metadata?.IsArabic ? 'ar' : 'en'

		switch (actions) {
			case 'En_Route_Pickup':
				await this.handleEnRoutePickup(numbers, language, id)
				break
			case 'bags_collected':
				await this.handleBagsCollected(updateRequestServicesDto, id)
				break
			case 'bags_returned':
				await this.handleBagsReturned(numbers, language, id, metadata)
				break
			case 'outForDelvery':
				await this.handleOutForDelivery(numbers, language, id)
				break
		}
	}

	private async handleEnRoutePickup(
		numbers: string,
		language: string,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		id: string,
	) {
		const message = SmsMessage['Handsfree Request']['En Route for Pickup'][language]
		await this.smsService.sendSms(numbers, message, numbers)
	}

	private async handleBagsCollected(
		updateRequestServicesDto: UpdateRequestServicesDto,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		id: string,
	) {
		const { metadata } = updateRequestServicesDto
		const numbers = metadata?.customer?.phone_number
		const language = metadata?.IsArabic ? 'ar' : 'en'
		const bagsNumber = metadata?.bags_number || 0

		// Get unique identifiers and count them
		const tagNumbers = [...new Set(
			metadata?.bagIdentifiers?.map(bag => bag.identifier) || [],
		)]

		const message = SmsMessage.get('Handsfree Request', 'Bags Collected', language, {
			tagNumbers: tagNumbers.join(', '),
			bagsNumber,
		})

		await this.smsService.sendSms(numbers, message, numbers)
	}

	private async handleBagsReturned(
		numbers: string,
		language: string,
		id: string,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		metadata?: any,
	) {
		const message = SmsMessage.get('Handsfree Request', 'Bags Returned', language, { id })
		await this.smsService.sendSms(numbers, message, numbers)
	}

	private async handleOutForDelivery(
		numbers: string,
		language: string,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		id: string,
	) {
		const message = SmsMessage['Handsfree Request']['Out for Delivery'][language]
		await this.smsService.sendSms(numbers, message, numbers)
	}
}
