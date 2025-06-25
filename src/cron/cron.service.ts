import { Inject, Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { InjectRepository } from '@nestjs/typeorm'
import { ElasticService } from 'ElasticSearch/elasticsearch.service'
import { RequestServices } from 'requestServices/entities/requestServices.entity'
import { Repository } from 'typeorm'
import * as moment from 'moment'
import { TasksServices } from 'userTask/task.service'
import { Tasks } from 'userTask/entities/task.entity'
import { ComplaintsService } from 'complaint/complaint.service'
import { RequestServicesService } from 'requestServices/requestServices.service'
import { VouchersService } from 'vochers/vouchers.service'
import axios from 'axios'
import SmsMessage from 'requestServices/messages/smsMessages'
import { resolveSrv } from 'dns/promises'
import { SmsService } from '../sms/sms.service'

@Injectable()
export class CronsService {
	constructor(
		private readonly tasksService: TasksServices, // Ensure the service name is correct
		private readonly complaintService: ComplaintsService, // Ensure the service name is correct
		private readonly elasticService: ElasticService,
		private readonly requestServicesService: RequestServicesService,
		private readonly vouchersService: VouchersService,
		private readonly smsService: SmsService,
	) {
	}


	// @Cron(CronExpression.EVERY_2_HOURS)
	@Cron(CronExpression.EVERY_30_SECONDS)
	async handleCron() {
		const status = 'Closed'
		const page = 1
		const per_page = 100
		const complaint_tasks = await this.elasticService.searchComplaintTask('tasks', status, page, per_page)
		// console.log(complaint_tasks.results.length)
		for (const task of complaint_tasks.results as any[]) {
			if (task.createdAt) {
				const taskDate = moment(task.createdAt)
				const now = moment()
				const hoursDifference = now.diff(taskDate, 'hours')
				let level = null
				if (hoursDifference >= 48 && hoursDifference < 72 && task.type === 'First Level') {
					level = 'Escalated (Level 1)'
				}
				if (hoursDifference >= 72 && hoursDifference < 120 && task.type === 'Final Level') {
					level = 'Escalated (Level 2)'
				}
				if (hoursDifference >= 120 && task.type === 'Escalated 2') {
					level = 'Escalated (Level 3)'
				}
				// console.log(hoursDifference,task.type)
				if (level) {
					console.log(taskDate, now, hoursDifference, task.type, 'Complaint ID', task.complaints.id)
					task.type = level
					task.action_role = 'system'
					await this.tasksService.update(task.id, task, null)
				}
			} else {
				console.log(`Complaint ID: ${task.id}, createdAt not found`)
			}
		}
	}

	@Cron(CronExpression.EVERY_DAY_AT_10AM)
	async handleExtendedVoucher() {
		const page = 1
		const per_page = 200
		const complaint_tasks = await this.elasticService.searchExtendedVoucher('services', page, per_page)
		const data = complaint_tasks.results
		for (let i = 0; i < data.length; i++) {
			let updated = false
			for (let j = 0; j < data[i].metadata.voucher.length; j++) {
				for (let z = 0; z < data[i].metadata.voucher[j].vouchers.length; z++) {
					const element = data[i].metadata.voucher[j].vouchers[z]
					if (element.metadata.status === 'Extended') {
						const now_date = new Date()
						const extended_expired_date = new Date(element.metadata.extanded_expired_date)
						if (now_date > extended_expired_date) {
							data[i].metadata.voucher[j].vouchers[z].metadata.status = 'Expired'
							data[i].metadata.voucher[j].vouchers[z].status = 'Expired'
							await this.vouchersService.update(element.id, element)
							updated = true
						} else {
							const timeDiff = extended_expired_date.getTime() - now_date.getTime()
							const daysLeft = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
							if (daysLeft === 3) {
								const numbers = data[i].metadata.customer.phone_number || data[i].metadata.Company.phone_number
								const language = data[i]?.metadata?.IsArabic ? 'ar' : 'en'
								const message = SmsMessage[data.type]['Note Extented'][language]
								await this.sendSms(numbers, `${message}\nhttps://main.d3n0sp6u84gnwb.amplifyapp.com/#/services/${data.id}/rating`, numbers)
							}
						}
					}
				}
			}
			if (updated) {
				await this.requestServicesService.update(data[i].id, data[i])
				await this.elasticService.updateDocument('services', data[i].id, data[i])
			}

		}
	}

	@Cron('0 0 9-21 * * *')
	async updateIncidentReportingStatus() {
		try {

			// Search for all Incident Reporting cases with Open status
			const incidentCases = await this.elasticService.search('services', {
				type: 'Incident Reporting',
				state: 'Open',
			}, 1, 1000) // Get up to 1000 cases

			if (!incidentCases || !incidentCases.results || incidentCases.results.length === 0) {
				return
			}

			const now = moment()
			let updatedCount = 0

			for (const incident of incidentCases.results) {
				// Skip if no createdAt timestamp
				if (!incident.createdAt) continue

				const createdAt = moment(incident.createdAt)
				const hoursDifference = now.diff(createdAt, 'hours')

				// Only update status if at least 24 hours have passed
				if (hoursDifference >= 24) {

					// Prepare update data
					const updateData = {
						state: 'Pending Internal',
						metadata: {
							...incident.metadata,
							statusChangedAt: now.toDate(),
							previousState: 'Open',
							statusChangeReason: 'Automatic status change after 24 hours',
						},
						type: incident.type,
						name: incident.name,
						actions: null, // Include required property even if not used
					}

					// Update the service record
					await this.requestServicesService.update(incident.id, updateData)
					updatedCount++
				}
			}

			if (updatedCount > 0) {
				console.log(`Updated ${updatedCount} incident cases to 'Pending Internal' status`)
			}
		} catch (error) {
			console.error('Error updating incident statuses:', error)
		}
	}

	@Cron(CronExpression.EVERY_DAY_AT_10AM)
	async handleVoucherExpiryReminders() {
		try {
			const result = await this.vouchersService.sendExpiryReminders()
		} catch (error) {
			console.error('Error sending voucher expiry reminders:', error)
		}
	}

	async sendSms(data: any, message: any, number: string) {
		return await this.smsService.sendSms(data, message, number)
	}


	async checkUserConsent(number: string): Promise<boolean> {
		const approvedNumbers = ['+962776850132']
		return approvedNumbers.includes(number)
	}

	@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
	async updateRefundedVouchers() {
		try {
			await this.vouchersService.updateRefundedVouchers()
		} catch (error) {
			console.error('Error updating refunded vouchers:', error)
		}
	}
}
