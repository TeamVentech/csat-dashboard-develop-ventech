import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Complaints } from './entities/complaint.entity';
import { CreateComplaintServicesDto } from './dto/create.dto';
import { UpdateComplaintServicesDto } from './dto/update.dto';
import { ElasticService } from 'ElasticSearch/elasticsearch.service';
import { NotificationsGateway } from 'notifications/notifications.gateway';
import { TasksService } from 'userTask/task.service';
import { TouchPointsService } from 'touchpoint/touch-points.service';

@Injectable()
export class ComplaintsService {
  constructor(
    @Inject('COMPLAINT_SERVICES_REPOSITORY')
    private readonly complaintsRepository: Repository<Complaints>,
    private readonly elasticService: ElasticService,
    private readonly taskService: TasksService,
    private readonly notificationsGateway: NotificationsGateway, // Inject gateway
    private readonly touchpointService: TouchPointsService, // Inject gateway

  ) { }

  async create(createComplaintsDto: CreateComplaintServicesDto) {
    const data = this.complaintsRepository.create(createComplaintsDto);
    const complaint = await this.complaintsRepository.save(data);
    await this.sendRealTimeNotifications(complaint);
    const touchpoint = await this.touchpointService.findOne(createComplaintsDto.touchpoint.id)
    await this.elasticService.indexData('complaints', complaint.id, complaint);
    const assignedTo = [...new Set(touchpoint.workflow.First_Level.map(user => user.role).flat())];
    console.log(assignedTo);
    const tasks_payload = {
      "taskId": complaint.id,
      "name": complaint.type,
      "type": "First Level",
      "assignedTo": assignedTo,
      "status": "PENDING",
      "complaintId": complaint.complaintId,
      "actions": [
        {
          "actors": "",
          "actions": "",
          "status": ""
        }
      ]
    }
    console.log(tasks_payload)
    await this.taskService.create(tasks_payload)

  }

  private async sendRealTimeNotifications(complaint: Complaints) {
    const rolesInSections = complaint.sections.map(section => section.role).flat();

    // Iterate over the roles and send notifications
    for (const role of rolesInSections) {
      const message = `A new complaint has been created with ID: ${complaint.complaintId}`;
      await this.notificationsGateway.sendNotificationToRole(role, message);
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

  async remove(id: string) {
    const Complaints = await this.findOne(id);
    // await this.complaintsRepository.remove(Complaints);
  }
}
