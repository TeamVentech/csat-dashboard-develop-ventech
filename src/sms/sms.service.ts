import { Injectable } from '@nestjs/common'
import axios from 'axios'

@Injectable()
export class SmsService {
	async sendSms(data: any, message: string, number: string) {
		const senderId = 'srvCityMall'
		const numbers = number
		const accName = 'CityMall'
		const accPass = 'G_PAXDujRvrw_KoD'

		// const smsUrl = `https://josmsservice.com/SMSServices/Clients/Prof/RestSingleSMS_General/SendSMS`;
		const smsUrl = 'https://www.josms.net/SMSServices/Clients/Prof/SingleSMS_General/SMSService.asmx/SendSMS'
		try {
			const response = await axios.get(smsUrl, {
				params: {
					senderid: senderId,
					numbers: numbers,
					accname: accName,
					AccPass: accPass,
					msg: encodeURIComponent(message),
					id: '',
				},
			})
			return response.data
		} catch (error) {
			console.error(`Failed to send SMS to ${number}:`, error)
			throw error
		}
	}
}
