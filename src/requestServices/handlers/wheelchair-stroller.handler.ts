import { Injectable } from '@nestjs/common'
import { ServicesService } from 'service/services.service'
import { UpdateRequestServicesDto } from '../dto/update.dto'
import SmsMessage from '../messages/smsMessages'
import { SmsService } from 'sms/sms.service'

@Injectable()
export class WheelchairStrollerHandler {
	constructor(
		private readonly servicesService: ServicesService,
		private readonly smsService: SmsService,
	) {
	}

	async handleWheelchairRequest(
		updateRequestServicesDto: UpdateRequestServicesDto, id: string,
	) {
		const { actions, metadata } = updateRequestServicesDto
		const numbers = metadata?.customer?.phone_number
		const language = metadata?.IsArabic ? 'ar' : 'en'
		switch (actions) {
			case 'out_for_delivery':
				await this.handleOutForDelivery(numbers, language, 'Wheelchair', id)
				break
			case 'En_Route_Pickup':
				await this.handleEnRoutePickup(numbers, language, 'Wheelchair', id)
				break
			case 'In_Service_Whileechair':
				await this.handleInService(numbers, language, 'Wheelchair', id)
				break
			case 'Item_Returned':
				await this.handleItemReturned(updateRequestServicesDto, 'Wheelchair', id)
				break
		}
	}

	async handleStrollerRequest(updateRequestServicesDto: UpdateRequestServicesDto, id: string) {
		const { actions, metadata } = updateRequestServicesDto
		const numbers = metadata?.customer?.phone_number
		const language = metadata?.IsArabic ? 'ar' : 'en'
		switch (actions) {
			case 'out_for_delivery':
				await this.handleOutForDelivery(numbers, language, 'Stroller', id)
				break
			case 'En_Route_Pickup':
				await this.handleEnRoutePickup(numbers, language, 'Stroller', id)
				break
			case 'In_Service_Whileechair':
				await this.handleInService(numbers, language, 'Stroller', id)
				break
			case 'Item_Returned':
				await this.handleItemReturned(updateRequestServicesDto, 'Stroller', id)
				break
		}
	}

	private async handleOutForDelivery(
		numbers: string,
		language: string,
		type: 'Wheelchair' | 'Stroller' = 'Wheelchair',
		id: string,
	) {
		const message = SmsMessage[`${type} Request`]['Out for Delivery'][language]
		await this.smsService.sendSms(numbers, message, numbers)
	}

	private async handleEnRoutePickup(
		numbers: string,
		language: string,
		type: 'Wheelchair' | 'Stroller' = 'Wheelchair',
		id: string,
	) {
		const message = SmsMessage[`${type} Request`]['En Route for Pickup'][language]
		await this.smsService.sendSms(numbers, message, numbers)
	}

	private async handleInService(
		numbers: string,
		language: string,
		type: 'Wheelchair' | 'Stroller' = 'Wheelchair',
		id: string,
	) {
		const message = SmsMessage[`${type} Request`]['In Service'][language]
		await this.smsService.sendSms(numbers, message, numbers)
	}

	private async handleItemReturned(
		updateRequestServicesDto: UpdateRequestServicesDto,
		type: 'Wheelchair' | 'Stroller' = 'Wheelchair',
		id: string,
	) {
		const {
			metadata,
			metadata: { customer: { phone_number: numbers }, IsArabic },
		} = updateRequestServicesDto
		const language = IsArabic ? 'ar' : 'en'

		if (metadata?.service?.id) {
			if (metadata.service.status === 'TEMPORARY') {
				await this.servicesService.remove(metadata.service.id)
			} else {
				await this.servicesService.update(metadata.service.id, { status: 'AVAILABLE' })
			}
		} else {
			console.warn('Cannot update service status: service ID is undefined')
		}

		const message = SmsMessage.get(`${type} Request`, 'Item Returned', language, { id })
		await this.smsService.sendSms(numbers, message, numbers)
	}
}
