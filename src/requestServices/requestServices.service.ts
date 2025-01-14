import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequestServices } from './entities/requestServices.entity';
import { CreateRequestServicesDto } from './dto/create.dto';
import { UpdateRequestServicesDto } from './dto/update.dto';
import axios from 'axios';
import SmsMessage from './messages/smsMessages';
import cron from 'node-cron';
import { ElasticService } from 'ElasticSearch/elasticsearch.service';

@Injectable()
export class RequestServicesService {
  constructor(
    @Inject('REQUEST_SERVICES_REPOSITORY')
    private readonly requestServicesRepository: Repository<RequestServices>,
    private readonly elasticService: ElasticService,

  ) { }

  async create(createRequestServicesDto: CreateRequestServicesDto) {
    try {
      const numbers = createRequestServicesDto?.metadata?.parents?.phone_number || createRequestServicesDto?.metadata?.customer?.phone_number || createRequestServicesDto?.metadata?.Company?.constact?.phone_number;
      if (createRequestServicesDto.type === 'Found Child') {
        if (createRequestServicesDto.metadata.parents.phone_number) {
          const numbers = createRequestServicesDto?.metadata?.parents?.phone_number
          const message = createRequestServicesDto.metadata.isArabic ? "عزيزي العميل، تم العثور على طفلكم وهو الآن في مكتب خدمة العملاء بالطابق الأرضي في سيتي مول. يُرجى إحضار هوية سارية لاستلام الطفل. لمزيد من المساعدة، يُرجى الاتصال على [رقم خدمة العملاء]." : "Dear Customer, your child has been found and is safe at the Customer Care Desk on the Ground Floor of City Mall. Please bring a valid ID to collect your child."
          await this.sendSms(numbers, message, numbers)
          createRequestServicesDto.state = "Awaiting Collection"
        }
      }
      else if (createRequestServicesDto.name !== 'Gift Voucher Sales') {
        const language = createRequestServicesDto?.metadata?.IsArabic ? "ar" : "en"
        const message = SmsMessage[createRequestServicesDto.type][createRequestServicesDto.state][language]
        await this.sendSms(numbers, message, numbers)
      }
      const Service = this.requestServicesRepository.create(createRequestServicesDto);
      var savedService = await this.requestServicesRepository.save(Service);
      await this.elasticService.indexData('services', Service.id, Service);

    } catch (error) {
      console.error('Error sending SMS:', error.message);
    }

    return savedService;
  }


  async findAll(page, perPage, filterOptions) {
    page = page || 1;
    perPage = perPage || 10;
    const queryBuilder = this.requestServicesRepository.createQueryBuilder('user');
  
    // Apply filters based on filterOptions
    if (filterOptions) {
      if (filterOptions.search) {
        const searchString = filterOptions.search.startsWith(' ')
          ? filterOptions.search.replace(' ', '+')
          : filterOptions.search;
        filterOptions.search = searchString;
        queryBuilder.andWhere('(user.type ILIKE :search)', {
          search: `%${filterOptions.search}%`, // Use wildcards for substring search
        });
      }
  
      Object.keys(filterOptions).forEach(key => {
        if (key !== 'search' && filterOptions[key]) {
          queryBuilder.andWhere(`user.${key} = :${key}`, { [key]: filterOptions[key] });
        }
      });
    }
  
    // Sort by createdAt in descending order
    queryBuilder.orderBy('user.createdAt', 'DESC');
  
    const [data, total] = await queryBuilder
      .skip((page - 1) * perPage)
      .take(perPage)
      .getManyAndCount();
  
    return { data, total };
  }
  
  async findOne(id: string) {
    const RequestServices =  await this.elasticService.getById('services', id);
    if (!RequestServices) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }
    return RequestServices.data;
  }
  async findOneColumn(id: string) {
    const RequestServices = await this.requestServicesRepository.findOne({ where: { id: id } });
    if (!RequestServices) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }
    return RequestServices;
  }

  async findType(type: string) {
    const RequestServices = await this.requestServicesRepository.find({ where: { type: type } });
    if (!RequestServices) {
      throw new NotFoundException(`Department with ID ${type} not found`);
    }
    return RequestServices;
  }


  // Update a department by IDs
  async update(id: string, updateRequestServicesDto: UpdateRequestServicesDto) {
    const data = await this.findOneColumn(id);
    if (data.state !== 'Closed' && updateRequestServicesDto.state === 'Closed') {
      const numbers = data?.metadata?.parents?.phone_number || data?.metadata?.customer?.phone_number || data?.metadata?.Company?.constact?.phone_number;
      const language = updateRequestServicesDto?.metadata?.IsArabic ? "ar" : "en"
      const message = SmsMessage[updateRequestServicesDto.type][updateRequestServicesDto.state][language]
      await this.sendSms(numbers, `${message}https://main.d3n0sp6u84gnwb.amplifyapp.com/#/services/${data.id}/rating`, numbers)
    }
    if (data.state === 'Open' && updateRequestServicesDto.state === 'Child Found' && updateRequestServicesDto.type === 'Lost Child') {
      const numbers = data?.metadata?.parents?.phone_number
      await this.sendSms(numbers, `Your Child Found Location : Floor : ${updateRequestServicesDto.metadata.location.floor}, Area : ${updateRequestServicesDto.metadata.location.tenant}`, numbers)
    }
    if (data.state === 'Open' && updateRequestServicesDto.state === 'Item Found' && updateRequestServicesDto.type === 'Lost Item') {
      const numbers = data?.metadata?.parents?.phone_number
      const language = updateRequestServicesDto?.metadata?.IsArabic ? "ar" : "en"
      const message = SmsMessage[updateRequestServicesDto.type][updateRequestServicesDto.state][language]
      await this.sendSms(numbers, `Your Child Found Location : Floor : ${updateRequestServicesDto.metadata.location.floor}, Area : ${updateRequestServicesDto.metadata.location.tenant}`, numbers)
    }
    if (updateRequestServicesDto.name === 'Gift Voucher Sales' && updateRequestServicesDto.state === "Sold" && data.state === "Pending") {
      const numbers = updateRequestServicesDto?.metadata?.customer?.phone_number || updateRequestServicesDto?.metadata?.Company?.constact?.phone_number
      const message = updateRequestServicesDto.metadata.isArabic ? "عزيزي العميل، تم العثور على طفلكم وهو الآن في مكتب خدمة العملاء بالطابق الأرضي في سيتي مول. يُرجى إحضار هوية سارية لاستلام الطفل. لمزيد من المساعدة، يُرجى الاتصال على [رقم خدمة العمsلاء]." : "Dears Customer, your child has been found and is safe at the Customer Care Desk on the Ground Floor of City Mall. Please bring a valid ID to collect your child."
      await this.sendSms(numbers, message, numbers)
    }
    await this.requestServicesRepository.update(id, updateRequestServicesDto);
    await this.elasticService.updateDocument('services', id, updateRequestServicesDto);
    return this.findOne(id);
  }


  async rating(id: string, rate: any) {
    const data = await this.findOneColumn(id);
    await this.requestServicesRepository.update(id, { ...data, rating: rate.rating });
    return this.findOne(id);
  }

  async remove(id: string) {
    const RequestServices = await this.findOneColumn(id);
    await this.requestServicesRepository.remove(RequestServices);
  }

  async sendSms(data: any, message: string, number: string) {
    const senderId = 'City Mall';
    const numbers = number
    const accName = 'CityMall';
    const accPass = 'G_PAXDujRvrw_KoD';
    const msg = message;

    const smsUrl = `https://josmsservice.com/SMSServices/Clients/Prof/RestSingleSMS_General/SendSMS`;
    const response = await axios.get(smsUrl, {
      params: {
        senderid: senderId,
        numbers: numbers,
        accname: accName,
        AccPass: accPass,
        msg: msg,
      },
    });
  }

}
