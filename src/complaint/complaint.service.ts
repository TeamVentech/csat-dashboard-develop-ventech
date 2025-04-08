import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Complaints } from './entities/complaint.entity';
import { CreateComplaintServicesDto } from './dto/create.dto';
import { UpdateComplaintServicesDto } from './dto/update.dto';
import { ElasticService } from 'ElasticSearch/elasticsearch.service';
// import { NotificationsGateway } from 'notifications/notifications.gateway';
import { TasksServices } from 'userTask/task.service';
import { TouchPointsService } from 'touchpoint/touch-points.service';
import { UsersService } from 'users/users.service';
import { EmailService } from 'email/email.service';
import { SurveysService } from 'surveys/surveys.service';
import { TenantsService } from 'tenants/tenants.service';
import { SmsService } from 'sms/sms.service';

@Injectable()
export class ComplaintsService {
  constructor(
    @Inject('COMPLAINT_SERVICES_REPOSITORY')
    private readonly complaintsRepository: Repository<Complaints>,
    private readonly elasticService: ElasticService,
    private readonly taskService: TasksServices,
    private readonly userService: UsersService,
    private readonly SurveyService: SurveysService,
    private readonly emailService: EmailService,
    // private readonly notificationsGateway: NotificationsGateway, // Inject gateway
    private readonly touchpointService: TouchPointsService, // Inject gateway
    private readonly tenantService: TenantsService, // Inject tenant service
    private readonly smsService: SmsService,
  ) { }

  async create(createComplaintsDto: CreateComplaintServicesDto) {
    // Check if incident time is in the future
    if (createComplaintsDto.metadata?.time_incident) {
      const incidentTime = new Date(createComplaintsDto.metadata.time_incident);
      const currentTime = new Date();
      
      if (incidentTime.getTime() > currentTime.getTime()) {
        throw new BadRequestException('Incident time cannot be in the future');
      }
    }
    
    if(createComplaintsDto.type === "Survey Complaint"){
      const survey = await this.SurveyService.findOne(createComplaintsDto.metadata.survey_id)
      const question =  survey.metadata.questions.filter(user => user.id === createComplaintsDto.metadata.question_id)
      createComplaintsDto.metadata.question_label = question[0].question
      createComplaintsDto.metadata.answer_label = question[0].choices[createComplaintsDto.metadata.answer]
    }
    
    // Check if this is a tenant complaint and if tenant data needs to be updated
    if (createComplaintsDto.type === "Tenant Complaint" && createComplaintsDto.tenant && createComplaintsDto.tenant.id) {
      try {
        // Get the current tenant data
        const existingTenant = await this.tenantService.findOne(createComplaintsDto.tenant.id);
        
        // Check for changes in tenant data
        const tenantUpdates = {};
        const updateableFields = ['name', 'contact_name', 'email', 'manager_account', 'manager_email', 'phone_number'];
        
        let hasChanges = false;
        updateableFields.forEach(field => {
          if (createComplaintsDto.tenant[field] && createComplaintsDto.tenant[field] !== existingTenant[field]) {
            tenantUpdates[field] = createComplaintsDto.tenant[field];
            hasChanges = true;
          }
        });
        
        // Update tenant if there are changes
        if (hasChanges) {
          console.log('Tenant data changed, updating tenant:', tenantUpdates);
          await this.tenantService.update(existingTenant.id, tenantUpdates);
          // Use the updated tenant data
          createComplaintsDto.tenant = await this.tenantService.findOne(existingTenant.id);
        }
      } catch (error) {
        console.error('Error updating tenant data:', error);
        // Continue with complaint creation even if tenant update fails
      }
    }
    
    const payload = {
      "name": createComplaintsDto.name,
      "type": createComplaintsDto.type,
      "status": createComplaintsDto.status,
      "customerId": createComplaintsDto?.customer?.id,
      "tenantId": createComplaintsDto?.tenant?.id,
      "tenant": createComplaintsDto?.tenant,
      "categoryId": createComplaintsDto.category.id,
      "addedBy": createComplaintsDto.addedBy,
      "touchpointId": createComplaintsDto.touchpoint.id,
      "sections": createComplaintsDto.sections,
      "metadata": createComplaintsDto.metadata,
    }
    const data = this.complaintsRepository.create(payload);
    const complaint = await this.complaintsRepository.save(data);
    if (createComplaintsDto.type === "Tenants Complaints") {
      complaint.tenant = createComplaintsDto.tenant
    }
    else {
      complaint.customer = createComplaintsDto.customer
    }
    complaint.touchpoint = createComplaintsDto.touchpoint
    complaint.category = createComplaintsDto.category
    const touchpoint = await this.touchpointService.findOne(createComplaintsDto.touchpoint.id)
    const complaint_response = await this.elasticService.indexData('complaints', complaint.id, complaint);
    if (!Array.isArray(touchpoint.workflow.CX_Team)) {
      throw new NotFoundException('workflow sub-category is not a valid ');
    }
    let assignedTo = [...new Set(touchpoint.workflow.CX_Team.map(user => user.name).flat())];
    if(createComplaintsDto.type === "Survey Complaint"){
      assignedTo = ["Super_Admin"]
      // assignedTo = ["CX Section Head"]
    }
    console.log(assignedTo)
    const tasks_payload = {
      "taskId": complaint.id,
      "name": complaint.type,
      "type": "CX Team",
      "assignedTo": assignedTo,
      "status": "Open",
      "complaintId": complaint.complaintId,
      "actions": {}
    }
    const users = await this.userService.getUsersByRoles(assignedTo)
    const email_user =  [...new Set(users.map(user => user.email).flat())]
    this.emailService.sendEmail(email_user, "nazir.alkahwaji@gmail.com", "Complaint Actions", "Take Actions"," ", complaint.id,  "System", "1",`https://main.d3n0sp6u84gnwb.amplifyapp.com/complaint/${complaint.id}/details`)
    await this.taskService.create(tasks_payload, complaint)

    // Send SMS notification for non-survey complaints
    if (createComplaintsDto.type !== "Survey Complaint") {
      const phoneNumber = createComplaintsDto?.customer?.phone_number || createComplaintsDto?.tenant?.phone_number
      if (phoneNumber) {
        const isArabic = createComplaintsDto?.metadata?.IsArabic || false;
        const message = isArabic 
          ? `زبوننا العزيز، تم استلام شكوتكم وتحويلها للدائرة المعنية. رقم ملف الشكوى الخاص بكم هو ${complaint.complaintId}. سنبلغكم بأي جديد.`
          : `Dear Customer, Your complaint has been received, & transferred to concerned department. Your complaint file # is ${complaint.complaintId}. We will keep you updated.`;
        
        try {
          await this.smsService.sendSms(null, message, phoneNumber);
        } catch (error) {
          console.error('Failed to send SMS notification:', error);
        }
      }
    }

    return this.findOne(complaint.id)
  }

  private async sendRealTimeNotifications(complaint: Complaints) {
    const rolesInSections = complaint.sections.map(section => section.role).flat();

    // Iterate over the roles and send notifications
    for (const role of rolesInSections) {
      const message = `A new complaint has been created with ID: ${complaint.complaintId}`;
      // await this.notificationsGateway.sendNotificationToRole(role, message);
    }
  }

  // async findAll(page, perPage, filterOptions) {
  //   page = page || 1;
  //   perPage = perPage || 10;
  //   const queryBuilder = this.complaintsRepository.createQueryBuilder('user')
  //   .leftJoinAndSelect('user.customer', 'customer')
  //   .leftJoinAndSelect('user.category', 'category')
  //   // Apply filters based on filterOptions
  //   if (filterOptions) {    
  //     if (filterOptions.search) {
  //       const searchString =await filterOptions.search.startsWith(' ')
  //         ? filterOptions.search.replace(' ', '+')
  //         : filterOptions.search;
  //       filterOptions.search = searchString
  //       queryBuilder.andWhere('(customer.name ILIKE :search)', {
  //         search: `%${filterOptions.search}%`, // Use wildcards for substring search
  //       });

  //     }

  //     Object.keys(filterOptions).forEach(key => {
  //       if (key !== 'search' && filterOptions[key]) {
  //         queryBuilder.andWhere(`user.${key} = :${key}`, { [key]: filterOptions[key] });
  //       }
  //     });
  //   }

  //   const [data, total] = await queryBuilder
  //     .skip((page - 1) * perPage)
  //     .take(perPage)
  //     .getManyAndCount();

  //   return { data, total };
  // }

  async findOne(id: string) {
    const RequestServices = await this.elasticService.getById('complaints', id);
    if (!RequestServices) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }
    return RequestServices.data;
  }

  // async findOne(id: string){
  //   const Complaints = await this.complaintsRepository.findOne({ where: { id: id } });
  //   if (!Complaints) {
  //     throw new NotFoundException(`Department with ID ${id} not found`);
  //   }
  //   return Complaints;
  // }

  async findType(type: string) {
    const Complaints = await this.complaintsRepository.find({ where: { type: type } });
    if (!Complaints) {
      throw new NotFoundException(`Department with ID ${type} not found`);
    }
    return Complaints;
  }



  // Update a complaint by ID
  async update(id: string, updateComplaintsDto: UpdateComplaintServicesDto) {
    await this.findOne(id);
    await this.complaintsRepository.update(id, updateComplaintsDto);
    await this.elasticService.updateDocument('complaints', id, updateComplaintsDto);
    return this.findOne(id);
  }

  async rating(id: string, rate: any) {
    const data = await this.findOne(id);
    data.rating = rate.rating;
    await this.complaintsRepository.update(id, data);
    await this.elasticService.updateDocument('complaints', id, data);
    return this.findOne(id);
  }

  async remove(id: string) {
    const Complaints = await this.findOne(id);
    // await this.complaintsRepository.remove(Complaints);
  }
}
