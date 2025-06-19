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
		id: string,
	) {
		const message = SmsMessage['Handsfree Request']['En Route for Pickup'][language]
		await this.smsService.sendSms(numbers, message, numbers)
	}

	private async handleBagsCollected(
		updateRequestServicesDto: UpdateRequestServicesDto,
		id: string,
	) {
		const { metadata } = updateRequestServicesDto
		const numbers = metadata?.customer?.phone_number
		const language = metadata?.IsArabic ? 'ar' : 'en'
		const bagsNumber = metadata?.bags_number || 0

		// Get unique identifiers and count them
		const uniqueIdentifiers = [...new Set(
			metadata?.bagIdentifiers?.map(bag => bag.identifier) || [],
		)]

		const message = {
			'ar': `زبوننا العزيز،\nشكرا لطلب خدمة الأمانات. تم استلام حقائب عدد (${bagsNumber}) وتأمينها. رقم البطاقة: ${uniqueIdentifiers.join(', ')}.\nيرجى الاستلام قبل الساعة 10م أو طلب توصيلها إلى أي موقع في المول.\nللمساعدة، اتصل على 0798502319.`,
			'en': `Dear Customer,\nThank you for using our Handsfree service. Your bags have been collected & secured.\nTag numbers: ${uniqueIdentifiers.join(', ')}. Number of bags: ${bagsNumber}.\nPlease collect your bags before 10pm or request delivery to any location in City Mall.\nFor inquiries, call 0798502319.`,
		}

		// Get the message in the correct language
		const messages = message[language]

		await this.smsService.sendSms(numbers, messages, numbers)
	}

	private async handleBagsReturned(
		numbers: string,
		language: string,
		id: string,
		metadata?: any,
	) {
		// Get unique identifiers and count them
		const uniqueIdentifiers = [...new Set(
			metadata?.bagIdentifiers?.map(bag => bag.identifier) || [],
		)]

		let message = {
			'ar': `شكراً لك على استخدام خدمة الأمانات. نرجو أن تكون تجربة مميزة لك.\nيرجى تقييم الخدمة من خلال الرابط`,
			'en': `Thank you for your using our Handsfree service. We hope you had an enjoyable experience.\nPlease rate our service by following the below link:`,
		}

		const messages = message[language]
		await this.smsService.sendSms(
			numbers,
			`${messages}\nhttps://main.d3n0sp6u84gnwb.amplifyapp.com/#/services/${id}/rating`,
			numbers,
		)
	}

	private async handleOutForDelivery(
		numbers: string,
		language: string,
		id: string,
	) {
		const message = SmsMessage['Handsfree Request']['Out for Delivery'][language]
		await this.smsService.sendSms(numbers, message, numbers)
	}
}
