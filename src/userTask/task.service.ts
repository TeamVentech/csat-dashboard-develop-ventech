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

	// Update a task by ID
	async update(id: string, updateTasksDto: UpdateTaskServicesDto, file) {
		const task_data = await this.findOne(id)
		const data = updateTasksDto.complaints
		// if()

		if (updateTasksDto.action_role === 'CX_Team') {
			if (updateTasksDto.actions["Confirm"].status === "Approve") {
				const assignedTo = [...new Set(data.touchpoint.workflow.First_Level.map(user => user.name).flat())];
				updateTasksDto.type = "First Level"
				updateTasksDto.complaints.status = "Pending (First Level)"
				updateTasksDto.status = "Pending (First Level)"
				// updateTasksDto.actions[0].status = "Pending (First Level)"
				const complaint_update = updateTasksDto.complaints
				delete complaint_update.category
				delete complaint_update.customer
				delete complaint_update.touchpoint
				await this.complaintsRepository.update(
					{ id: complaint_update.id, customerId: complaint_update.customerId, categoryId: complaint_update.categoryId, touchpointId: complaint_update.touchpointId },
					complaint_update
				);
				await this.elasticService.updateDocument('complaints', complaint_update.id, complaint_update);
				updateTasksDto.assignedTo = assignedTo
			}
			else {
				updateTasksDto.type = "Disapprove"
				const assignedTo = [...new Set(data.touchpoint.workflow.GM.map(user => user.name).flat())];
				updateTasksDto.complaints.status = "Disapprove"
				updateTasksDto.status = "Disapprove"
				const complaint_update = updateTasksDto.complaints
				delete complaint_update.category
				delete complaint_update.customer
				delete complaint_update.touchpoint
				await this.complaintsRepository.update(
					{ id: complaint_update.id, customerId: complaint_update.customerId, categoryId: complaint_update.categoryId, touchpointId: complaint_update.touchpointId },
					complaint_update
				);
				await this.elasticService.updateDocument('complaints', complaint_update.id, complaint_update);
				updateTasksDto.assignedTo = assignedTo
			}
		}

		if (updateTasksDto.action_role === 'first_role') {
			const assignedTo = [...new Set(data.touchpoint.workflow.Final_Level.map(user => user.name).flat())];
			updateTasksDto.type = "Final Level"
			updateTasksDto.status = "Pending Review (Final Level)"
			updateTasksDto.complaints.status = "Pending Review (Final Level)"
			if(file){
				updateTasksDto.actions['firstLevel'].Attach = await this.filesAzureService.uploadFile(file, "complaint"); 
			}
			updateTasksDto.assignedTo = assignedTo
			const complaint_update = updateTasksDto.complaints
			delete complaint_update.category
			delete complaint_update.customer
			delete complaint_update.touchpoint
			await this.complaintsRepository.update(
				{ id: complaint_update.id, customerId: complaint_update.customerId, categoryId: complaint_update.categoryId, touchpointId: complaint_update.touchpointId },
				complaint_update
			);
			await this.elasticService.updateDocument('complaints', complaint_update.id, complaint_update);
		}

		if (updateTasksDto.action_role === 'final_role') {
			const assignedTo = [...new Set(data.touchpoint.workflow.CX_Team.map(user => user.name).flat())];
			updateTasksDto.type = "CX Check Team"
			updateTasksDto.status = "Pending (CX Team)"
			updateTasksDto.complaints.status = "Pending (CX Team)"
			updateTasksDto.assignedTo = assignedTo
			const complaint_update = updateTasksDto.complaints
			delete complaint_update.category
			delete complaint_update.customer
			delete complaint_update.touchpoint
			await this.complaintsRepository.update(
				{ id: complaint_update.id, customerId: complaint_update.customerId, categoryId: complaint_update.categoryId, touchpointId: complaint_update.touchpointId },
				complaint_update
			);
			await this.elasticService.updateDocument('complaints', complaint_update.id, complaint_update);
		}

		if (updateTasksDto.action_role === 'resend_role') {
			const assignedTo = [...new Set(data.touchpoint.workflow.Final_Level.map(user => user.name).flat())];
			updateTasksDto.type = "Final Level"
			updateTasksDto.status = "Pending Review (Final Level)"
			updateTasksDto.complaints.status = "Pending Review (Final Level)"
			if(file){
				updateTasksDto.actions['firstResend'].Attach = await this.filesAzureService.uploadFile(file, "complaint"); 
			}
			updateTasksDto.assignedTo = assignedTo
			const complaint_update = updateTasksDto.complaints
			delete complaint_update.category
			delete complaint_update.customer
			delete complaint_update.touchpoint
			await this.complaintsRepository.update(
				{ id: complaint_update.id, customerId: complaint_update.customerId, categoryId: complaint_update.categoryId, touchpointId: complaint_update.touchpointId },
				complaint_update
			);
			await this.elasticService.updateDocument('complaints', complaint_update.id, complaint_update);
		}

		if(updateTasksDto.type === "Escalated (Level 1)"){
			const assignedTo = [...new Set(data.touchpoint.workflow.Level_1.map(user => user.name).flat())];
			updateTasksDto.type = "Escalated 1"
			updateTasksDto.status = "Escalated (Level 1)"
			updateTasksDto.complaints.status = "Escalated (Level 1)"
			updateTasksDto.assignedTo = assignedTo
			const complaint_update = updateTasksDto.complaints
			delete complaint_update.category
			delete complaint_update.customer
			delete complaint_update.touchpoint
			await this.complaintsRepository.update(
				{ id: complaint_update.id, customerId: complaint_update.customerId, categoryId: complaint_update.categoryId, touchpointId: complaint_update.touchpointId },
				complaint_update
			);
			await this.elasticService.updateDocument('complaints', complaint_update.id, complaint_update);

		}
		if(updateTasksDto.type === "Escalated (Level 2)"){
			const assignedTo = [...new Set(data.touchpoint.workflow.Level_2.map(user => user.name).flat())];
			updateTasksDto.type = "Escalated 2"
			updateTasksDto.status = "Escalated (Level 2)"
			updateTasksDto.complaints.status = "Escalated (Level 2)"
			updateTasksDto.assignedTo = assignedTo
			const complaint_update = updateTasksDto.complaints
			delete complaint_update.category
			delete complaint_update.customer
			delete complaint_update.touchpoint
			await this.complaintsRepository.update(
				{ id: complaint_update.id, customerId: complaint_update.customerId, categoryId: complaint_update.categoryId, touchpointId: complaint_update.touchpointId },
				complaint_update
			);
			await this.elasticService.updateDocument('complaints', complaint_update.id, complaint_update);

		}
		if(updateTasksDto.type === "Escalated (Level 3)"){
			const assignedTo = [...new Set(data.touchpoint.workflow.Level_3.map(user => user.name).flat())];
			updateTasksDto.type = "Escalated 3"
			updateTasksDto.status = "Escalated (Level 3)"
			updateTasksDto.complaints.status = "Escalated (Level 3)"
			updateTasksDto.assignedTo = assignedTo
			const complaint_update = updateTasksDto.complaints
			delete complaint_update.category
			delete complaint_update.customer
			delete complaint_update.touchpoint
			await this.complaintsRepository.update(
				{ id: complaint_update.id, customerId: complaint_update.customerId, categoryId: complaint_update.categoryId, touchpointId: complaint_update.touchpointId },
				complaint_update
			);
			await this.elasticService.updateDocument('complaints', complaint_update.id, complaint_update);

		}


		if (updateTasksDto.action_role === 'CX_Check_Team') {
			const assignedTo = [...new Set(data.touchpoint.workflow.CX_Team.map(user => user.name).flat())];
			updateTasksDto.assignedTo = assignedTo
			updateTasksDto.type = "GM Team"
			updateTasksDto.status = "Closed"
			updateTasksDto.complaints.status = "Closed"
			const complaint_update = updateTasksDto.complaints
			delete complaint_update.category
			delete complaint_update.customer
			delete complaint_update.touchpoint
			await this.complaintsRepository.update(
				{ id: complaint_update.id, customerId: complaint_update.customerId, categoryId: complaint_update.categoryId, touchpointId: complaint_update.touchpointId },
				complaint_update
			);
			await this.elasticService.updateDocument('complaints', complaint_update.id, complaint_update);

		}
		if (updateTasksDto.action_role === 'GM_Team') {
			updateTasksDto.type = "GM Team"
			updateTasksDto.complaints.status = "Closed"
			updateTasksDto.status = "Closed"
			const complaint_update = updateTasksDto.complaints
			delete complaint_update.category
			delete complaint_update.customer
			delete complaint_update.touchpoint
			await this.complaintsRepository.update(
				{ id: complaint_update.id, customerId: complaint_update.customerId, categoryId: complaint_update.categoryId, touchpointId: complaint_update.touchpointId },
				complaint_update
			); await this.elasticService.updateDocument('complaints', updateTasksDto.complaints.id, updateTasksDto.complaints);
			updateTasksDto.assignedTo = []
		}
		const elastic_data = updateTasksDto;
		delete updateTasksDto.complaints;
		delete updateTasksDto.action_role;
		await this.tasksRepository.update(id, updateTasksDto);
		await this.elasticService.updateDocument('tasks', id, elastic_data);
		const users = await this.usersService.getUsersByRoles(updateTasksDto.assignedTo)
		const email_user =  [...new Set(users.map(user => user.email).flat())]
		await this.emailService.sendEmail(email_user, "nazir.alkahwaji@gmail.com", "Complaint Actions", "Take Actions"," ", data.id,  "System", "1",`http://localhost:5173/complaint/${data.id}/details`)

		return this.findOne(id);
	}

	async updateRequest(id: string, updateTasksDto: UpdateTaskServicesDto, file) {
		// const task_data = await this.findOne(id)
		const data = updateTasksDto.complaints
		const assignedTo = [...new Set(data.touchpoint.workflow.First_Level.map(user => user.name).flat())];
		updateTasksDto.type = "Re-sent"
		updateTasksDto.assignedTo = assignedTo
		updateTasksDto.complaints.status = "Re-sent"
		updateTasksDto.status = "Re-sent"
		if(file){
			updateTasksDto.actions['firstResend'].Attach = await this.filesAzureService.uploadFile(file, "complaint"); 
		}
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
		await this.emailService.sendEmail(email_user, "nazir.alkahwaji@gmail.com", "Complaint Actions", "Take Actions"," ", complaint_update.id,  "System", "1",`http://localhost:5173/complaint/${complaint_update.id}/details`)
	
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
