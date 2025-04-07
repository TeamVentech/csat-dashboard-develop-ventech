import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tasks } from './entities/task.entity';
import { CreateTaskDto } from './dto/create.dto';
import { UpdateTaskServicesDto } from './dto/update.dto';
import { ElasticService } from 'ElasticSearch/elasticsearch.service';
import { TouchPointsService } from 'touchpoint/touch-points.service';
import { Complaints } from 'complaint/entities/complaint.entity';
import { UsersService } from 'users/users.service';
// import { ComplaintsService } from 'complaint/complaint.service';
import emailjs from "emailjs-com";
import { AppService } from 'app.service';
import { MailtrapClient } from 'mailtrap';
import { EmailService } from 'email/email.service';
import { FilesS3Service } from 'azure-storage/aws-storage.service';
import { SmsService } from 'sms/sms.service';

@Injectable()
export class TasksServices {
	private client: MailtrapClient;
	private sender = {
		email: 'hello@demomailtrap.com',
		name: 'CSAT MANAGEMENT',
	};

	constructor(
		@Inject('TASK_REPOSITORY')
		private readonly tasksRepository: Repository<Tasks>,
		@Inject('COMPLAINT_SERVICES_REPOSITORY')
		private complaintsRepository: Repository<Complaints>,
		private readonly elasticService: ElasticService,
		private readonly touchPointsService: TouchPointsService,
		private readonly usersService: UsersService,
		private readonly emailService: EmailService,
		private readonly filesAzureService: FilesS3Service, // Inject TouchPointsSegrvice
		private readonly smsService: SmsService,
	) { 
		this.client = new MailtrapClient({
			token: '59a71cdda41f91268fbbdf3f1c8ebc64',
		})
	}

	async create(createTasksDto: CreateTaskDto, complaint: any) {
		const data = this.tasksRepository.create(createTasksDto);
		const task = await this.tasksRepository.save(data);
		const tast_data = {
			...task,
			complaints: complaint
		}

		const users = await this.usersService.getUsersByRoles(data.assignedTo)
		for (let i = 0; i < users.length; i++) {
			// console.log(users[i].email)
			// const email_data = {
			// 	complaint_id: complaint.id,
			// 	submitted_by: users[i].role,
			// 	priority: 'High',
			// 	action_link: `http://localhost:5173/complaint/${complaint.id}/details`,
			// }

			// await this.sendComplaintEmail(users[i].email, email_data )
			// emailjs.init("j1J5QDvgfcV5L0xRJkTZg");
			// await emailjs.send("service_i2wj5vl", "template_kqw2l2h", {
			// from_name: "NAZIR",
			// user_name: users[i].username,
			// complaint_id: complaint.id,
			// submitted_by: data.assignedTo,
			// priority: "1",
			// action_link: `http://localhost:5173/complaint/${complaint.id}/details`,
			// to_email: users[i].email,
			// from_email: "nazir.alkahwaji@gmail.com",

			// });
		}
		await this.elasticService.indexData('tasks', task.id, tast_data);

	}
	async sendComplaintEmail(toEmail: string, variables: { complaint_id: string, submitted_by: string, priority: string, action_link: string }) {
		try {
			const response = await this.client.send({
				from: this.sender,
				to: [{ email: toEmail }],
				template_uuid: 'ecec7c33-55d1-4ad2-9314-6d9131eb76dd',
				template_variables: variables,
			});

			// console.log('Email sent successfully:', response);
			return response;
		} catch (error) {
			console.error('Error sending email:', error);
			throw error;
		}
	}

	async findOne(id: string) {
		const RequestServices = await this.elasticService.getById('tasks', id);
		if (!RequestServices) {
			throw new NotFoundException(`Department with ID ${id} not found`);
		}
		return RequestServices.data;
	}

	async getByComplaintId(id: string) {
		const RequestServices = await this.elasticService.getByComplaintId('tasks', id);
		if (!RequestServices) {
			throw new NotFoundException(`Department with ID ${id} not found`);
		}
		// console.log(RequestServices)
		return RequestServices.data;
	}

	private async updateComplaintStatus(complaintData: any) {
		const complaint_update = { ...complaintData };
		delete complaint_update.category;
		delete complaint_update.customer;
		delete complaint_update.touchpoint;
		
		await this.complaintsRepository.update(
			{ 
				id: complaint_update.id, 
				customerId: complaint_update.customerId, 
				categoryId: complaint_update.categoryId, 
				touchpointId: complaint_update.touchpointId 
			},
			complaint_update
		);
		await this.elasticService.updateDocument('complaints', complaint_update.id, complaint_update);
	}

	private async handleFileUpload(file: any, actionKey: string, updateTasksDto: any) {
		if (file) {
			updateTasksDto.actions[actionKey].Attach = await this.filesAzureService.uploadFile(file, "complaint");
		}
	}

	private async sendNotificationEmail(assignedTo: string[], complaintId: string) {
		const users = await this.usersService.getUsersByRoles(assignedTo);
		const email_users = [...new Set(users.map(user => user.email).flat())];
		await this.emailService.sendEmail(
			email_users,
			"nazir.alkahwaji@gmail.com",
			"Complaint Actions",
			"Take Actions",
			" ",
			complaintId,
			"System",
			"1",
			`http://localhost:5173/complaint/${complaintId}/details`
		);
	}

	private async handleCXTeamAction(updateTasksDto: any, workflow: any) {
		if (updateTasksDto.actions["Confirm"].status === "Approve") {
			const assignedTo = [...new Set(workflow.First_Level.map(user => user.name).flat())];
			updateTasksDto.type = "First Level";
			updateTasksDto.complaints.status = "Pending (First Level)";
			updateTasksDto.status = "Pending (First Level)";
			updateTasksDto.assignedTo = assignedTo;
		} else {
			const assignedTo = [...new Set(workflow.GM.map(user => user.name).flat())];
			updateTasksDto.type = "Disapprove";
			updateTasksDto.complaints.status = "Disapprove";
			updateTasksDto.status = "Disapprove";
			updateTasksDto.assignedTo = assignedTo;
		}
	}

	private async handleFirstRoleAction(updateTasksDto: any, workflow: any, file: any) {
		const assignedTo = [...new Set(workflow.Final_Level.map(user => user.name).flat())];
		updateTasksDto.type = "Final Level";
		updateTasksDto.status = "Pending Review (Final Level)";
		updateTasksDto.complaints.status = "Pending Review (Final Level)";
		await this.handleFileUpload(file, 'firstLevel', updateTasksDto);
		updateTasksDto.assignedTo = assignedTo;
	}

	private async handleFinalRoleAction(updateTasksDto: any, workflow: any) {
		const assignedTo = [...new Set(workflow.CX_Team.map(user => user.name).flat())];
		updateTasksDto.type = "CX Check Team";
		updateTasksDto.status = "Pending (CX Team)";
		updateTasksDto.complaints.status = "Pending (CX Team)";
		updateTasksDto.assignedTo = assignedTo;
	}

	private async handleResendRoleAction(updateTasksDto: any, workflow: any, file: any) {
		const assignedTo = [...new Set(workflow.Final_Level.map(user => user.name).flat())];
		updateTasksDto.type = "Final Level";
		updateTasksDto.status = "Pending Review (Final Level)";
		updateTasksDto.complaints.status = "Pending Review (Final Level)";
		await this.handleFileUpload(file, 'firstResend', updateTasksDto);
		updateTasksDto.assignedTo = assignedTo;
	}

	private async handleEscalationAction(updateTasksDto: any, workflow: any, level: number) {
		const assignedTo = [...new Set(workflow[`Level_${level}`].map(user => user.name).flat())];
		updateTasksDto.type = `Escalated ${level}`;
		updateTasksDto.status = `Escalated (Level ${level})`;
		updateTasksDto.complaints.status = `Escalated (Level ${level})`;
		updateTasksDto.assignedTo = assignedTo;
	}

	private async sendSmsToCustomer(phoneNumber: string, complaintId: string, isArabic: boolean = false) {
		const ratingLink = `http://localhost:5173/complaint/${complaintId}/rating`;
		const message = isArabic 
			? `زبوننا العزيز،\nتم إغلاق شكوتكم\nيرجى تقييم الخدمة من خلال الرابط\n${ratingLink}`
			: `Dear Customer,\nWe would like to inform you that your complaint has been resolved.\nPlease rate our service by following the below link:\n${ratingLink}`;
		
		await this.smsService.sendSms(null, message, phoneNumber);
	}

	private async handleCXCheckTeamAction(updateTasksDto: any, workflow: any) {
		const assignedTo = [...new Set(workflow.CX_Team.map(user => user.name).flat())];
		updateTasksDto.assignedTo = assignedTo;
		updateTasksDto.type = "GM Team";
		updateTasksDto.status = "Closed";
		updateTasksDto.complaints.status = "Closed";

		// Send SMS to customer if phone number is available
		if (updateTasksDto.complaints.customer?.phone_number) {
			await this.sendSmsToCustomer(
				updateTasksDto.complaints.customer.phone_number,
				updateTasksDto.complaints.complaintId,
				updateTasksDto.complaints.metadata?.IsArabic
			);
		}
	}

	private async handleGMTeamAction(updateTasksDto: any) {
		updateTasksDto.type = "GM Team";
		updateTasksDto.complaints.status = "Closed";
		updateTasksDto.status = "Closed";
		updateTasksDto.assignedTo = [];

		// Send SMS to customer if phone number is available
		if (updateTasksDto.complaints.customer?.phone_number) {
			await this.sendSmsToCustomer(
				updateTasksDto.complaints.customer.phone_number,
				updateTasksDto.complaints.complaintId,
				updateTasksDto.complaints.metadata?.IsArabic
			);
		}
	}

	async update(id: string, updateTasksDto: UpdateTaskServicesDto, file: any) {
		const task_data = await this.findOne(id);
		const data = updateTasksDto.complaints;

		if (data) {
			await this.complaintsRepository.update({ id: data.id }, data);
			await this.elasticService.updateDocument('complaints', data.id, data);
			updateTasksDto.name = data.name;
			updateTasksDto.complaints = data;
		}

		const touchpoint = await this.touchPointsService.findOne(data.touchpointId);
		if (!touchpoint) {
			throw new NotFoundException(`Touchpoint with ID ${data.touchpointId} not found`);
		}
		const workflow = touchpoint.workflow;

		switch (updateTasksDto.action_role) {
			case 'CX_Team':
				await this.handleCXTeamAction(updateTasksDto, workflow);
				break;
			case 'first_role':
				await this.handleFirstRoleAction(updateTasksDto, workflow, file);
				break;
			case 'final_role':
				await this.handleFinalRoleAction(updateTasksDto, workflow);
				break;
			case 'resend_role':
				await this.handleResendRoleAction(updateTasksDto, workflow, file);
				break;
			case 'CX_Check_Team':
				await this.handleCXCheckTeamAction(updateTasksDto, workflow);
				break;
			case 'GM_Team':
				await this.handleGMTeamAction(updateTasksDto);
				break;
		}

		if (updateTasksDto.type === "Escalated (Level 1)") {
			await this.handleEscalationAction(updateTasksDto, workflow, 1);
		} else if (updateTasksDto.type === "Escalated (Level 2)") {
			await this.handleEscalationAction(updateTasksDto, workflow, 2);
		} else if (updateTasksDto.type === "Escalated (Level 3)") {
			await this.handleEscalationAction(updateTasksDto, workflow, 3);
		}

		await this.updateComplaintStatus(updateTasksDto.complaints);

		const elastic_data = { ...updateTasksDto };
		delete updateTasksDto.complaints;
		delete updateTasksDto.action_role;

		await this.tasksRepository.update(id, updateTasksDto);
		await this.elasticService.updateDocument('tasks', id, elastic_data);

		this.sendNotificationEmail(updateTasksDto.assignedTo, data.id);

		return this.findOne(id);
	}

	async updateRequest(id: string, updateTasksDto: UpdateTaskServicesDto) {
		// const task_data = await this.findOne(id)
		const data = updateTasksDto.complaints
		const touchpoint = await this.touchPointsService.findOne(data.touchpointId);
		if (!touchpoint) {
			throw new NotFoundException(`Touchpoint with ID ${data.touchpointId} not found`);
		}
		const workflow = touchpoint.workflow;
		
		const assignedTo = [...new Set(workflow.First_Level.map(user => user.name).flat())];
		updateTasksDto.type = "Re-sent"
		updateTasksDto.assignedTo = assignedTo
		updateTasksDto.complaints.status = "Re-sent"
		updateTasksDto.status = "Re-sent"
		// if(file){
		// 	updateTasksDto.actions['firstResend'].Attach = await this.filesAzureService.uploadFile(file, "complaint"); 
		// }
		const complaint_update = updateTasksDto.complaints
		delete complaint_update.category
		delete complaint_update.customer
		delete complaint_update.touchpoint
		await this.complaintsRepository.update(
			{ id: complaint_update.id, customerId: complaint_update.customerId, categoryId: complaint_update.categoryId, touchpointId: complaint_update.touchpointId },
			complaint_update
		);
		await this.elasticService.updateDocument('complaints', complaint_update.id, complaint_update);
		const elastic_data = updateTasksDto;
		delete updateTasksDto.complaints;
		delete updateTasksDto.action_role;
		
		await this.tasksRepository.update(id, updateTasksDto);
		await this.elasticService.updateDocument('tasks', id, elastic_data);
		const users = await this.usersService.getUsersByRoles(updateTasksDto.assignedTo)
		const email_user =  [...new Set(users.map(user => user.email).flat())]
		this.emailService.sendEmail(email_user, "nazir.alkahwaji@gmail.com", "Complaint Actions", "Take Actions"," ", complaint_update.id,  "System", "1",`http://localhost:5173/complaint/${complaint_update.id}/details`)
	
		return this.findOne(id);
	}

	async updateEscalation(id: string, updateTasksDto: UpdateTaskServicesDto) {
		// const task_data = await this.findOne(id)
		const data = updateTasksDto.complaints
		const elastic_data = updateTasksDto;
		delete updateTasksDto.complaints;
		await this.tasksRepository.update(id, updateTasksDto);
		await this.elasticService.updateDocument('tasks', id, elastic_data);
		return this.findOne(id);
	}


	async remove(id: string) {
		const Tasks = await this.findOne(id);
		// await this.tasksRepository.remove(Tasks);
	}
}
