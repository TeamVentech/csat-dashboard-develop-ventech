import { Injectable, BadRequestException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { CustomersService } from 'customers/customers.service'
import { TenantsService } from 'tenants/tenants.service'
import { SmsService } from 'sms/sms.service'

@Injectable()
export class CustomerAuthService {
	private otpStore: Map<string, { otp: string; timestamp: number }> = new Map()
	private readonly OTP_EXPIRY = 5 * 60 * 1000 // 5 minutes in milliseconds

	constructor(
		private jwtService: JwtService,
		private configService: ConfigService,
		private customersService: CustomersService,
		private tenantsService: TenantsService, // Added TenantsService
		private smsService: SmsService,
	) {
	}

	generateOTP(): string {
		return Math.floor(100000 + Math.random() * 900000).toString()
	}

	async sendOTP(phoneNumber: string): Promise<{ message: string }> {
		// In a real application, you would integrate with an SMS service here
		// For now, we'll just store the OTP in memory
		const otp = this.generateOTP()
		this.otpStore.set(phoneNumber, {
			otp,
			timestamp: Date.now(),
		})

		await this.sendSms(otp, otp, phoneNumber)

		return { message: `OTP sent successfully : ${otp}` }
	}

	async verifyOTP(phoneNumber: string, otp: string): Promise<{
		accessToken: string,
		customer?: any,
		tenant?: any
	}> {
		const storedData = this.otpStore.get(phoneNumber)

		if (!storedData) {
			throw new BadRequestException('No OTP request found for this phone number')
		}

		if (Date.now() - storedData.timestamp > this.OTP_EXPIRY) {
			this.otpStore.delete(phoneNumber)
			throw new BadRequestException('OTP has expired')
		}

		if (storedData.otp !== otp) {
			throw new BadRequestException('Invalid OTP')
		}

		// Clear the OTP after successful verification
		this.otpStore.delete(phoneNumber)

		// Check if the phone number belongs to a tenant
		const tenant = await this.tenantsService.findByPhoneNumber(phoneNumber)

		let customer = await this.customersService.doesEmailOrPhoneExist(undefined, phoneNumber)

		// If customer doesn't exist, create a new one with just the phone number
		if (!customer) {
			const newCustomerData = {
				phone_number: phoneNumber,
				name: '',
				email: '',
			}

			customer = await this.customersService.create(newCustomerData)
		}

		// Generate JWT token with customer details
		const payload = {
			id: customer.id,
			name: customer.name,
			email: customer.email,
			phone_number: customer.phone_number,
			gender: customer.gender,
			age: customer.age,
			dob: customer.dob,
			role: 'customer',
		}

		const accessToken = this.jwtService.sign(payload)

		// Return both token and customer info, and tenant info if available
		return {
			accessToken,
			customer: {
				id: customer.id,
				name: customer.name,
				email: customer.email,
				phone_number: customer.phone_number,
				passport_number: customer.passport_number,
				gender: customer.gender,
				age: customer.age,
				dob: customer.dob,
			},
			tenant: tenant ? tenant : null,
		}
	}

	async sendSms(data: any, message: any, number: string) {
		return await this.smsService.sendSms(data, message, number)
	}
}
