import { Inject, Injectable, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequestServices } from './entities/requestServices.entity';
import { CreateRequestServicesDto } from './dto/create.dto';
import { UpdateRequestServicesDto } from './dto/update.dto';
import axios from 'axios';
import SmsMessage from './messages/smsMessages';
import cron from 'node-cron';
import { ElasticService } from 'ElasticSearch/elasticsearch.service';
import { VouchersService } from 'vochers/vouchers.service';
import { ServicesService } from 'service/services.service';
import { CustomersService } from 'customers/customers.service';
import { json } from 'stream/consumers';
import { instanceToPlain } from 'class-transformer';
import * as moment from 'moment';

@Injectable()
export class RequestServicesService {
  constructor(
    @Inject('REQUEST_SERVICES_REPOSITORY')
    private readonly requestServicesRepository: Repository<RequestServices>,
    private readonly elasticService: ElasticService,
    private readonly vouchersService: VouchersService,
    private readonly servicesService: ServicesService,
    private readonly customerService: CustomersService,

  ) { }

  async create(createRequestServicesDto: CreateRequestServicesDto) {
    try {
      const numbers = createRequestServicesDto?.metadata?.parents?.phone_number || createRequestServicesDto?.metadata?.customer?.phone_number || createRequestServicesDto?.metadata?.Company?.phone_number;
      
      // Ensure Incident Reporting cases always start with 'Open' status
      if (createRequestServicesDto.type === 'Incident Reporting') {
        createRequestServicesDto.state = 'Open'; // Force Open status
        
        // Add metadata to track the creation time for 24-hour calculation
        if (!createRequestServicesDto.metadata) {
          createRequestServicesDto.metadata = {};
        }
        createRequestServicesDto.metadata.reportedAt = new Date();
        createRequestServicesDto.metadata.statusChangeExpectedAt = moment().add(24, 'hours').toDate();
      }
      
      if (createRequestServicesDto.name === 'Gift Voucher Sales') {
        for (let i = 0; i < createRequestServicesDto.metadata.voucher.length; i++) {
          for (let j = 0; j < createRequestServicesDto.metadata.voucher[i].vouchers.length; j++) {
            createRequestServicesDto.metadata.voucher[i].vouchers[j].metadata.Client_ID = createRequestServicesDto.metadata.customer.id || createRequestServicesDto.metadata.Company.id
            createRequestServicesDto.metadata.voucher[i].vouchers[j].state = "Sold"
            createRequestServicesDto.metadata.voucher[i].vouchers[j].metadata.status = "Sold"
            createRequestServicesDto.metadata.voucher[i].vouchers[j].metadata.purchase_reason = createRequestServicesDto?.metadata?.reason_purchase
            createRequestServicesDto.metadata.voucher[i].vouchers[j].metadata.date_sale = new Date()
            createRequestServicesDto.metadata.voucher[i].vouchers[j].metadata.expired_date = createRequestServicesDto.metadata.Expiry_date
            createRequestServicesDto.metadata.voucher[i].vouchers[j].metadata.type_sale = createRequestServicesDto.type === "Corporate Voucher Sale" ? "Company" : "Individual"
            await this.vouchersService.update(createRequestServicesDto.metadata.voucher[i].vouchers[j].id, createRequestServicesDto.metadata.voucher[i].vouchers[j])
          }
        }
        const Service = this.requestServicesRepository.create(createRequestServicesDto);
        var savedService = await this.requestServicesRepository.save(Service);
        await this.elasticService.indexData('services', Service.id, Service);
        if(createRequestServicesDto.type === 'Individual Voucher Sale'){
          const numbers = createRequestServicesDto?.metadata?.customer?.phone_number 
          const language = createRequestServicesDto?.metadata?.IsArabic ? "ar" : "en"
          const message = SmsMessage[createRequestServicesDto.type]["Sold"][language]
          await this.sendSms(numbers, `${message}https://main.d3n0sp6u84gnwb.amplifyapp.com/#/services/${savedService.id}/rating`, numbers)
        }
      }
      else{
        if (createRequestServicesDto.type === 'Found Child') {
          if (createRequestServicesDto.metadata.parents.phone_number) {
            const numbers = createRequestServicesDto?.metadata?.parents?.phone_number
            const message = createRequestServicesDto.metadata.isArabic ? "تم العثور على طفلكم المفقود.\n يرجى التوجه لمكتب خدمة الزبائن في الطابق الأرضي لاستلام الطفل وإبراز هويتكم." : "Dear Customer,\n Your missing child was found. Please head immediately to Customer Care desk at Ground Floor to collect child and present your ID."
            await this.sendSms(numbers, message, numbers)
            createRequestServicesDto.state = "Awaiting Collection"
          }
        }
        else if (createRequestServicesDto.name !== 'Gift Voucher Sales' && createRequestServicesDto.name !== 'Incident Reporting' && createRequestServicesDto.name !== 'Added-Value Services') {
          const language = createRequestServicesDto?.metadata?.IsArabic ? "ar" : "en"
          const message = SmsMessage[createRequestServicesDto.type][createRequestServicesDto.state][language]
          await this.sendSms(numbers, message, numbers)
        }
        if (createRequestServicesDto.name === 'Lost Children Management') {
          if (createRequestServicesDto.type === "Lost Child") {
            const customers = createRequestServicesDto.metadata.parents
            const customer = await this.customerService.doesEmailOrPhoneExist(customers.email, customers.phone_number)
            if (customer) {
              await this.customerService.update(customer.id, { ...customers })
            }
            else {
              delete createRequestServicesDto?.metadata?.parents?.id;
              await this.customerService.create({ ...createRequestServicesDto.metadata.parents })
            }
          }
        }
        if (createRequestServicesDto.name === 'Suggestion Box' || createRequestServicesDto.name === 'Incident Reporting' || createRequestServicesDto.name === 'Lost Item Management' || createRequestServicesDto.type === 'Individual Voucher Sale') {
          const customers = createRequestServicesDto.metadata.customer
          const customer = await this.customerService.doesEmailOrPhoneExist(customers.email, customers.phone_number)
          if (customer) {
            await this.customerService.update(customer.id, { ...customers })
          }
          else {
            delete createRequestServicesDto?.metadata?.customer?.id;
            await this.customerService.create({ ...createRequestServicesDto.metadata.customer })
          }
        }
        if (createRequestServicesDto.name === 'Added-Value Services') {
          if (createRequestServicesDto.type !== "Handsfree Request") {
            let VoucherType= null
            let Service_data= null
            if (createRequestServicesDto.type === "Wheelchair & Stroller Request") {
              VoucherType = createRequestServicesDto.metadata.type
          }
          if (createRequestServicesDto.type === "Power Bank Request") {
              VoucherType = "Power Bank"
          }
            Service_data = await this.servicesService.findOneByTypeStatus(VoucherType, "AVAILABLE")
            if(!Service_data){
              const payload = {
                type: VoucherType,
                status: "AVAILABLE",
                addedBy: "system",
                numbers: 1,
              }             
              Service_data = await this.servicesService.create(payload)
            }
            createRequestServicesDto.metadata.service = Service_data
            await this.servicesService.update(Service_data.id, { status: "OCCUPIED" });
          }
          const customers = createRequestServicesDto.metadata.customer
          const customer = await this.customerService.doesEmailOrPhoneExist(customers.email, customers.phone_number)
          if (customer) {
            await this.customerService.update(customer.id, { ...customers })
          }
          else {
            delete createRequestServicesDto.metadata.customer.id;
            await this.customerService.create({ ...createRequestServicesDto.metadata.customer })
          }
          
        }
        const Service = this.requestServicesRepository.create(createRequestServicesDto);
        var savedService = await this.requestServicesRepository.save(Service);
        const transformedData = instanceToPlain(Service);
        await this.elasticService.indexData('services', Service.id, transformedData);
      }

    } catch (error) {
      console.error('Error sending SMS :', error.message);
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
    const RequestServices = await this.elasticService.getById('services', id);
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


  // Update a department by IDsdd
  async update(id: string, updateRequestServicesDto: UpdateRequestServicesDto) {
    const data = await this.findOneColumn(id);
    
    // Prevent manual change to 'Pending Internal' for Incident Reporting cases if 24 hours haven't passed
    if (data.type === 'Incident Reporting' && 
        data.state === 'Open' && 
        updateRequestServicesDto.state === 'Pending Internal') {
      
      // Only check time if this is a manual update (not from the cron job)
      if (!updateRequestServicesDto.metadata?.statusChangeReason ||
          updateRequestServicesDto.metadata.statusChangeReason !== 'Automatic status change after 24 hours') {
            
        const now = moment();
        const createdAt = moment(data.createdAt);
        const hoursDifference = now.diff(createdAt, 'hours');
        
        if (hoursDifference < 24) {
          throw new HttpException(
            'Cannot change Incident Reporting status to Pending Internal. This status will be set automatically after 24 hours from case creation.',
            HttpStatus.BAD_REQUEST
          );
        }
      }
    }
    
    if (data.state === 'Open' && updateRequestServicesDto.state === 'Child Found' && updateRequestServicesDto.type === 'Lost Child') {
      const numbers = data?.metadata?.parents?.phone_number
      const language = updateRequestServicesDto?.metadata?.IsArabic ? "ar" : "en"
      const message = SmsMessage[updateRequestServicesDto.type][updateRequestServicesDto.state][language]
      await this.sendSms(numbers, message, numbers)
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
    if (updateRequestServicesDto.type === "Wheelchair & Stroller Request" && updateRequestServicesDto.metadata.condition === "Damaged" && data.metadata.condition !== 'Damaged') {
      const numbers = updateRequestServicesDto?.metadata?.customer?.phone_number
      const message = updateRequestServicesDto.metadata.isArabic ? "السلعة تالفة، وفقًا للسياسة، يلزم دفع مبلغ 20 دينارًا أردنيًا" : "The item is damaged. As per policy, a payment of 20 JDs is required"
      await this.sendSms(numbers, message, numbers)
    }
  
    if (updateRequestServicesDto?.actions === "Awaiting Collection Child") {
      const numbers = updateRequestServicesDto?.metadata?.parents?.phone_number
      const language = updateRequestServicesDto?.metadata?.IsArabic ? "ar" : "en"
      updateRequestServicesDto.state = "Awaiting Collection"
      const message = SmsMessage[updateRequestServicesDto.type]["Awaiting Collection"][language]
      await this.sendSms(numbers, message, numbers)
    }

    if (updateRequestServicesDto?.actions === "Awaiting Collection Itme") {
      console.log(updateRequestServicesDto.actions)
      const numbers = updateRequestServicesDto?.metadata?.customer?.phone_number
      const language = updateRequestServicesDto?.metadata?.IsArabic ? "ar" : "en"
      updateRequestServicesDto.state = "Awaiting Collection"
      const message = SmsMessage[updateRequestServicesDto.type]["Awaiting Collection"][language]
      await this.sendSms(numbers, message, numbers)
    }

    if (updateRequestServicesDto?.actions === "Awaiting Collection") {
      const numbers = updateRequestServicesDto?.metadata?.parents?.phone_number
      const message = updateRequestServicesDto?.metadata?.IsArabic ? `Your Child Found Location : Floor : ${updateRequestServicesDto.metadata.location.floor}, Area : ${updateRequestServicesDto.metadata.location.tenant}` : `Your Child Found Location : Floor : ${updateRequestServicesDto.metadata.location.floor}, Area : ${updateRequestServicesDto.metadata.location.tenant}`
      await this.sendSms(numbers, message, numbers)
    }

    if (updateRequestServicesDto?.actions === "in_progress_item" || updateRequestServicesDto?.actions === "ArticleFound") {
      const numbers = updateRequestServicesDto?.metadata?.customer?.phone_number
      const language = updateRequestServicesDto?.metadata?.IsArabic ? "ar" : "en"
      if(updateRequestServicesDto?.actions === "ArticleFound"){
        const message = SmsMessage[updateRequestServicesDto.type]["Article Found"][language]
        await this.sendSms(numbers, `${message}\nhttps://main.d3n0sp6u84gnwb.amplifyapp.com/#/services/${data.id}/rating`, numbers)
      }
      else{
        const message = SmsMessage[updateRequestServicesDto.type]["In Progress"][language]
        await this.sendSms(numbers, message, numbers)
  
      }
    }
    if (updateRequestServicesDto?.actions === "in_progress_item_3") {
      const numbers = updateRequestServicesDto?.metadata?.customer?.phone_number
      const language = updateRequestServicesDto?.metadata?.IsArabic ? "ar" : "en"
      const message = SmsMessage[updateRequestServicesDto.type]["In Progress Day 3"][language]
      await this.sendSms(numbers, message, numbers)
    }
    if (updateRequestServicesDto?.actions === "refunded_voucher") {
      const numbers = data?.metadata?.customer?.phone_number || data?.metadata?.Company?.phone_number
      const language = updateRequestServicesDto?.metadata?.IsArabic ? "ar" : "en"
      const message = SmsMessage[updateRequestServicesDto.type]["Refunded"][language]
      await this.sendSms(numbers, `${message}https://main.d3n0sp6u84gnwb.amplifyapp.com/#/services/${data.id}/rating`, numbers)
    }
    if (updateRequestServicesDto?.actions === "Refunded") {
      const numbers = data?.metadata?.customer?.phone_number || data?.metadata?.Company?.phone_number
      const message = updateRequestServicesDto?.metadata?.IsArabic ? `Your Child Found Location : Floor : ${updateRequestServicesDto.metadata.location.floor}, Area : ${updateRequestServicesDto.metadata.location.tenant}` : `Your Child Found Location : Floor : ${updateRequestServicesDto.metadata.location.floor}, Area : ${updateRequestServicesDto.metadata.location.tenant}`
      await this.sendSms(numbers, message, numbers)
    }
    if (updateRequestServicesDto?.actions === "In Service" || updateRequestServicesDto?.actions === "Bags Collected") {
      const numbers = data?.metadata?.customer?.phone_number
      const language = updateRequestServicesDto?.metadata?.IsArabic ? "ar" : "en"
      const message = SmsMessage[updateRequestServicesDto.type][updateRequestServicesDto.state][language]
      await this.sendSms(numbers, message, numbers)
    }

    if (updateRequestServicesDto.type === "Wheelchair & Stroller Request") {
      if (updateRequestServicesDto.metadata.type === "Wheelchair") {
        if (updateRequestServicesDto?.actions === "out_for_delivery") {
          const numbers = updateRequestServicesDto?.metadata?.customer?.phone_number
          const language = updateRequestServicesDto?.metadata?.IsArabic ? "ar" : "en"
          const message = SmsMessage["Wheelchair Request"]["Out for Delivery"][language]
          await this.sendSms(numbers, message, numbers)
        }
        if (updateRequestServicesDto?.actions === "En_Route_Pickup") {
          const numbers = updateRequestServicesDto?.metadata?.customer?.phone_number
          const language = updateRequestServicesDto?.metadata?.IsArabic ? "ar" : "en"
          const message = SmsMessage["Wheelchair Request"]["En Route for Pickup"][language]
          await this.sendSms(numbers, message, numbers)
        }
        if (updateRequestServicesDto?.actions === "In_Service_Whileechair") {
          const numbers = updateRequestServicesDto?.metadata?.customer?.phone_number
          const language = updateRequestServicesDto?.metadata?.IsArabic ? "ar" : "en"
          const message = SmsMessage["Wheelchair Request"]["In Service"][language]
          await this.sendSms(numbers, message, numbers)
        }
        if (updateRequestServicesDto?.actions === "Item_Returned") {
          await this.servicesService.update(updateRequestServicesDto.metadata.service.id, { status: "AVAILABLE" });
          const numbers = updateRequestServicesDto?.metadata?.customer?.phone_number
          const language = updateRequestServicesDto?.metadata?.IsArabic ? "ar" : "en"
          const message = SmsMessage["Wheelchair Request"]["Item Returned"][language]
          await this.sendSms(numbers, message, numbers)
        }
      }
      if (updateRequestServicesDto.metadata.type === "Stroller") {
        if (updateRequestServicesDto?.actions === "out_for_delivery") {
          const numbers = updateRequestServicesDto?.metadata?.customer?.phone_number
          const language = updateRequestServicesDto?.metadata?.IsArabic ? "ar" : "en"
          const message = SmsMessage["Stroller Request"]["Out for Delivery"][language]
          await this.sendSms(numbers, message, numbers)
        }
        if (updateRequestServicesDto?.actions === "En_Route_Pickup") {
          const numbers = updateRequestServicesDto?.metadata?.customer?.phone_number
          const language = updateRequestServicesDto?.metadata?.IsArabic ? "ar" : "en"
          const message = SmsMessage["Stroller Request"]["En Route for Pickup"][language]
          await this.sendSms(numbers, message, numbers)
        }
        if (updateRequestServicesDto?.actions === "In_Service_Whileechair") {
          const numbers = updateRequestServicesDto?.metadata?.customer?.phone_number
          const language = updateRequestServicesDto?.metadata?.IsArabic ? "ar" : "en"
          const message = SmsMessage["Stroller Request"]["In Service"][language]
          await this.sendSms(numbers, message, numbers)
        }
        if (updateRequestServicesDto?.actions === "Item_Returned") {
          const numbers = updateRequestServicesDto?.metadata?.customer?.phone_number
          const language = updateRequestServicesDto?.metadata?.IsArabic ? "ar" : "en"
          const message = SmsMessage["Stroller Request"]["Item Returned"][language]
          await this.sendSms(numbers, message, numbers)
        }
      }
    }
    if (updateRequestServicesDto.type === "Power Bank Request") {
      if (updateRequestServicesDto?.actions === "out_for_delivery") {
        const numbers = updateRequestServicesDto?.metadata?.customer?.phone_number
        const language = updateRequestServicesDto?.metadata?.IsArabic ? "ar" : "en"
        const message = SmsMessage[updateRequestServicesDto.type]["Out for Delivery"][language]
        await this.sendSms(numbers, message, numbers)
      }
      if (updateRequestServicesDto?.actions === "En_Route_Pickup") {
        const numbers = updateRequestServicesDto?.metadata?.customer?.phone_number
        const language = updateRequestServicesDto?.metadata?.IsArabic ? "ar" : "en"
        const message = SmsMessage[updateRequestServicesDto.type]["En Route for Pickup"][language]
        await this.sendSms(numbers, message, numbers)
      }
      if (updateRequestServicesDto?.actions === "In_Service_Whileechair") {
        const numbers = updateRequestServicesDto?.metadata?.customer?.phone_number
        const language = updateRequestServicesDto?.metadata?.IsArabic ? "ar" : "en"
        const message = SmsMessage[updateRequestServicesDto.type]["In Service"][language]
        await this.sendSms(numbers, message, numbers)
      }
      if (updateRequestServicesDto?.actions === "Item_Returned") {
        const numbers = updateRequestServicesDto?.metadata?.customer?.phone_number
        const language = updateRequestServicesDto?.metadata?.IsArabic ? "ar" : "en"
        if (updateRequestServicesDto.metadata.condition === "Wire damaged") {
          const message = SmsMessage[updateRequestServicesDto.type]["Wire damaged"][language]
          await this.sendSms(numbers, message, numbers)
        }
        if (updateRequestServicesDto.metadata.condition === "Powerbank damaged") {
          const message = SmsMessage[updateRequestServicesDto.type]["Power bank damaged"][language]
          await this.sendSms(numbers, message, numbers)
        }
        if (updateRequestServicesDto.metadata.condition === "Powerbank and Wire damaged") {
          const message = SmsMessage[updateRequestServicesDto.type]["Wire and powerbank damaged"][language]
          await this.sendSms(numbers, message, numbers)
        }
        const message = SmsMessage[updateRequestServicesDto.type]["Item Returned"][language]
        await this.sendSms(numbers, message, numbers)
      }
    }
    if (updateRequestServicesDto.type === "Power Bank Request") {
      if (updateRequestServicesDto?.actions === "out_for_delivery") {
        const numbers = updateRequestServicesDto?.metadata?.customer?.phone_number
        const language = updateRequestServicesDto?.metadata?.IsArabic ? "ar" : "en"
        const message = SmsMessage[updateRequestServicesDto.type]["Out for Delivery"][language]
        await this.sendSms(numbers, message, numbers)
      }
      if (updateRequestServicesDto?.actions === "En_Route_Pickup") {
        const numbers = updateRequestServicesDto?.metadata?.customer?.phone_number
        const language = updateRequestServicesDto?.metadata?.IsArabic ? "ar" : "en"
        const message = SmsMessage[updateRequestServicesDto.type]["En Route for Pickup"][language]
        await this.sendSms(numbers, message, numbers)
      }
    }
    if (updateRequestServicesDto.type === "Handsfree Request") {
      // if (updateRequestServicesDto?.actions === "out_for_delivery") {
      //   const numbers = updateRequestServicesDto?.metadata?.customer?.phone_number
      //   const language = updateRequestServicesDto?.metadata?.IsArabic ? "ar" : "en"
      //   const message = SmsMessage[updateRequestServicesDto.type]["Out for Delivery"][language]
      //   await this.sendSms(numbers, message, numbers)
      // }
      if (updateRequestServicesDto?.actions === "En_Route_Pickup") {
        const numbers = updateRequestServicesDto?.metadata?.customer?.phone_number
        const language = updateRequestServicesDto?.metadata?.IsArabic ? "ar" : "en"
        const message = SmsMessage[updateRequestServicesDto.type]["En Route for Pickup"][language]
        await this.sendSms(numbers, message, numbers)
      }
      if (updateRequestServicesDto?.actions === "bags_collected") {
        const numbers = updateRequestServicesDto?.metadata?.customer?.phone_number
        const language = updateRequestServicesDto?.metadata?.IsArabic ? "ar" : "en"
        const message = SmsMessage[updateRequestServicesDto.type]["Bags Collected"][language]
        await this.sendSms(numbers, message, numbers)
      }
      if (updateRequestServicesDto?.actions === "bags_returned") {
        const numbers = updateRequestServicesDto?.metadata?.customer?.phone_number
        const language = updateRequestServicesDto?.metadata?.IsArabic ? "ar" : "en"
        const message = SmsMessage[updateRequestServicesDto.type]["Bags Returned"][language]
        await this.sendSms(numbers, message, numbers)
      }
      if (updateRequestServicesDto?.actions === "outForDelvery") {
        const numbers = updateRequestServicesDto?.metadata?.customer?.phone_number
        const language = updateRequestServicesDto?.metadata?.IsArabic ? "ar" : "en"
        const message = SmsMessage[updateRequestServicesDto.type]["Out for Delivery"][language]
        await this.sendSms(numbers, message, numbers)
      }
    }
    if ((data.state !== 'Closed' && updateRequestServicesDto.state === 'Closed')) {
      if (data.type === 'Incident Reporting' && data.state === 'Pending Internal') {
        const now = moment();
        const createdAt = moment(data.createdAt);
        const hoursDifference = now.diff(createdAt, 'hours');
        if (hoursDifference < 24 || !updateRequestServicesDto.metadata?.callCompleted) {
          throw new HttpException(
            'Cannot close incident case. Must wait 24 hours and mark call as completed.',
            HttpStatus.BAD_REQUEST
          );
        }
      }

      const numbers = data?.metadata?.parents?.phone_number || data?.metadata?.customer?.phone_number || data?.metadata?.Company?.constact?.phone_number || updateRequestServicesDto?.metadata?.parents?.phone_number;
      const language = updateRequestServicesDto?.metadata?.IsArabic ? "ar" : "en"
      const message = SmsMessage[updateRequestServicesDto.type][updateRequestServicesDto.state][language]
      if(updateRequestServicesDto.type === 'Child Found' || updateRequestServicesDto.type === 'Lost Child'){
        await this.sendSms(numbers, `${message}\nhttps://main.d3n0sp6u84gnwb.amplifyapp.com/#/services/${data.id}/ratin\n "Stay Safe" from City Mall`, numbers)
      }
      else{
        await this.sendSms(numbers, `${message}\nhttps://main.d3n0sp6u84gnwb.amplifyapp.com/#/services/${data.id}/rating`, numbers)
      }
    }
    console.log(JSON.stringify(updateRequestServicesDto))
    await this.requestServicesRepository.update(id, updateRequestServicesDto);
    await this.elasticService.updateDocument('services', id, updateRequestServicesDto);
    return this.requestServicesRepository.findOne({ where: { id } })
  }


  async rating(id: string, rate: any) {
    const data = await this.findOneColumn(id);
    data.rating = rate.rating
    await this.requestServicesRepository.update(id, data);
    await this.elasticService.updateDocument('services', id, data);
    return this.findOne(id);
  }

  async remove(id: string) {
    const RequestServices = await this.findOneColumn(id);
    await this.requestServicesRepository.remove(RequestServices);
  }

  async sendSms(data: any, message: any, number: string) {
    const senderId = 'City Mall';
    const numbers = number
    const accName = 'CityMall';
    const accPass = 'G_PAXDujRvrw_KoD';

    const smsUrl = `https://josmsservice.com/SMSServices/Clients/Prof/RestSingleSMS_General/SendSMS`;
    const response = await axios.get(smsUrl, {
      params: {
        senderid: senderId,
        numbers: numbers,
        accname: accName,
        AccPass: accPass,
        msg: encodeURIComponent(message)

      },
    });
  }
}
