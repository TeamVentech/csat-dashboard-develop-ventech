import {
  Inject,
  Injectable,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
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
import { AddedValueServiceDto } from './dto/added-value-service.dto';
import {
  WheelchairStrollerHandler,
  PowerBankHandler,
  HandsfreeHandler,
} from './handlers';
import { SmsService } from './services/sms.service';
import { ComplaintsService } from 'complaint/complaint.service';
import { AddedValueServiceHandler } from './handlers/added-value-service.handler';

@Injectable()
export class RequestServicesService {
  constructor(
    @Inject('REQUEST_SERVICES_REPOSITORY')
    private readonly requestServicesRepository: Repository<RequestServices>,
    private readonly elasticService: ElasticService,
    private readonly vouchersService: VouchersService,
    private readonly servicesService: ServicesService,
    private readonly customerService: CustomersService,
    private readonly wheelchairStrollerHandler: WheelchairStrollerHandler,
    private readonly powerBankHandler: PowerBankHandler,
    private readonly handsfreeHandler: HandsfreeHandler,
    private readonly smsService: SmsService,
    private readonly complaintsService: ComplaintsService,
    private readonly addedValueServiceHandler: AddedValueServiceHandler,
  ) {}

  async create(createRequestServicesDto: CreateRequestServicesDto) {
    try {
      const numbers =
        createRequestServicesDto?.metadata?.parents?.phone_number ||
        createRequestServicesDto?.metadata?.customer?.phone_number ||
        createRequestServicesDto?.metadata?.Company?.phone_number;

      // Ensure Incident Reporting cases always start with 'Open' status
      if (createRequestServicesDto.type === 'Incident Reporting') {
        createRequestServicesDto.state = 'Open'; // Force Open status

        // Add metadata to track the creation time for 24-hour calculation
        if (!createRequestServicesDto.metadata) {
          createRequestServicesDto.metadata = {};
        }
        createRequestServicesDto.metadata.reportedAt = new Date();
        createRequestServicesDto.metadata.statusChangeExpectedAt = moment()
          .add(24, 'hours')
          .toDate();
      }

      if (createRequestServicesDto.name === 'Gift Voucher Sales') {
        const Service = this.requestServicesRepository.create(
          createRequestServicesDto,
        );

        // Recalculate the total value based on vouchers
        let totalValue = 0;
        for (let i = 0; i < Service.metadata.voucher.length; i++) {
          const denomination = parseInt(
            Service.metadata.voucher[i].denominations,
          );

          // Count only vouchers that are not in "Refunded" state
          let countedVouchers = 0;
          for (
            let j = 0;
            j < Service.metadata.voucher[i].vouchers.length;
            j++
          ) {
            if (Service.metadata.voucher[i].vouchers[j].state !== 'Refunded') {
              countedVouchers++;
            }
          }

          totalValue += denomination * countedVouchers;
        }

        // Update the total value in metadata
        Service.metadata.value = totalValue;
        console.log(
          'Recalculated voucher total value (excluding Refunded):',
          totalValue,
        );

        for (let i = 0; i < Service.metadata.voucher.length; i++) {
          for (
            let j = 0;
            j < Service.metadata.voucher[i].vouchers.length;
            j++
          ) {
            Service.metadata.voucher[i].vouchers[j].metadata.Client_ID =
              Service.metadata.customer.id || Service.metadata.Company.id;
            Service.metadata.voucher[i].vouchers[j].state = 'Sold';
            Service.metadata.voucher[i].vouchers[j].metadata.status = 'Sold';
            Service.metadata.voucher[i].vouchers[j].metadata.purchase_reason =
              Service?.metadata?.reason_purchase;
            Service.metadata.voucher[i].vouchers[j].metadata.date_sale =
              new Date();
            Service.metadata.voucher[i].vouchers[j].metadata.transaction_id =
              Service.id;
            Service.metadata.voucher[i].vouchers[j].metadata.expired_date =
              Service.metadata.Expiry_date;
            Service.metadata.voucher[i].vouchers[j].metadata.type_sale =
              Service.type === 'Corporate Voucher Sale'
                ? 'Company'
                : 'Individual';
            await this.vouchersService.update(
              Service.metadata.voucher[i].vouchers[j].id,
              Service.metadata.voucher[i].vouchers[j],
            );
          }
        }
        // const Service = this.requestServicesRepository.create(createRequestServicesDto);
        var savedService = await this.requestServicesRepository.save(Service);
        await this.elasticService.indexData('services', Service.id, Service);
        if (createRequestServicesDto.type === 'Individual Voucher Sale') {
          const numbers =
            createRequestServicesDto?.metadata?.customer?.phone_number;
          const language = createRequestServicesDto?.metadata?.IsArabic
            ? 'ar'
            : 'en';
          const message =
            SmsMessage[createRequestServicesDto.type]['Sold'][language];
          await this.smsService.sendSms(
            numbers,
            `${message}\nhttps://main.d3n0sp6u84gnwb.amplifyapp.com/#/services/${savedService.id}/rating`,
            numbers,
          );
        } else {
          const numbers =
            createRequestServicesDto?.metadata?.Company?.phone_number;
          const language = createRequestServicesDto?.metadata?.IsArabic
            ? 'ar'
            : 'en';
          const message =
            SmsMessage[createRequestServicesDto.type]['Sold'][language];
          await this.smsService.sendSms(numbers, `${message}\nhttps://main.d3n0sp6u84gnwb.amplifyapp.com/#/services/${savedService.id}/rating`, numbers);
        }
      } else {
        if (createRequestServicesDto.type === 'Found Child') {
          if (createRequestServicesDto.metadata.parents.phone_number) {
            const numbers =
              createRequestServicesDto?.metadata?.parents?.phone_number;
            const message = createRequestServicesDto.metadata.IsArabic
              ? 'تم العثور على طفلكم تم العثور على طفلكم المفقود.\n يرجى التوجه لمكتب خدمة الزبائن في الطابق الأرضي لاستلام الطفل وإبراز هويتكم.'
              : 'Dear Customer,\n Your missing child was found. Please head immediately to Customer Care desk at Ground Floor to collect child and present your ID.';
            await this.smsService.sendSms(numbers, message, numbers);
            createRequestServicesDto.state = 'Awaiting Collection';
          }
        } else if (
          createRequestServicesDto.name !== 'Gift Voucher Sales' &&
          createRequestServicesDto.name !== 'Incident Reporting' &&
          createRequestServicesDto.name !== 'Added-Value Services'
        ) {
          const language = createRequestServicesDto?.metadata?.IsArabic
            ? 'ar'
            : 'en';
          const message =
            SmsMessage[createRequestServicesDto.type][
              createRequestServicesDto.state
            ][language];
          await this.smsService.sendSms(numbers, message, numbers);
        }
        if (createRequestServicesDto.name === 'Lost Children Management') {
          if (createRequestServicesDto.type === 'Lost Child') {
            const customers = createRequestServicesDto.metadata.parents;
            const customer = await this.customerService.doesEmailOrPhoneExist(
              customers.email,
              customers.phone_number,
            );
            if (customer) {
              await this.customerService.update(customer.id, { ...customers });
            } else {
              delete createRequestServicesDto?.metadata?.parents?.id;
              await this.customerService.create({
                ...createRequestServicesDto.metadata.parents,
              });
            }
          }
        }
        if (
          createRequestServicesDto.name === 'Suggestion Box' ||
          createRequestServicesDto.name === 'Incident Reporting' ||
          createRequestServicesDto.name === 'Lost Item Management' ||
          createRequestServicesDto.type === 'Individual Voucher Sale'
        ) {
          const customers = createRequestServicesDto.metadata.customer;
          const customer = await this.customerService.doesEmailOrPhoneExist(
            customers.email,
            customers.phone_number,
          );
          if (customer) {
            await this.customerService.update(customer.id, { ...customers });
          } else {
            delete createRequestServicesDto?.metadata?.customer?.id;
            await this.customerService.create({
              ...createRequestServicesDto.metadata.customer,
            });
          }
        }
        if (createRequestServicesDto.name === 'Added-Value Services') {
        }
        const Service = this.requestServicesRepository.create(
          createRequestServicesDto,
        );
        var savedService = await this.requestServicesRepository.save(Service);
        const transformedData = instanceToPlain(Service);
        await this.elasticService.indexData(
          'services',
          Service.id,
          transformedData,
        );
      }
    } catch (error) {
      console.error('Error sending SMS :', error.message);
    }

    return savedService;
  }

  async addedValueService(createRequestServicesDto: AddedValueServiceDto) {
    try {
      const numbers =
        createRequestServicesDto?.metadata?.customer?.phone_number;

      if (createRequestServicesDto.type !== 'Handsfree Request') {
        await this.addedValueServiceHandler.checkExistingCases(
          createRequestServicesDto.type,
          numbers,
          'Item Returned'
        );

        createRequestServicesDto.name = 'Added-Value Services';
        createRequestServicesDto.state = 'In Service';

        if (createRequestServicesDto.metadata.delivery) {
          createRequestServicesDto.state = 'Delivery Requested';
        }

        const Service_data =
          await this.addedValueServiceHandler.handleServiceAvailability(
            createRequestServicesDto,
          );
        createRequestServicesDto.metadata.service = Service_data;
      }

      await this.addedValueServiceHandler.handleCustomerCreation(
        createRequestServicesDto.metadata.customer,
      );

      const serviceData = this.requestServicesRepository.create(
        createRequestServicesDto,
      );
      const savedService = (await this.requestServicesRepository.save(
        serviceData,
      )) as unknown as RequestServices;

      if (savedService) {
        const transformedData = instanceToPlain(savedService);
        await this.elasticService.indexData(
          'services',
          savedService.id,
          transformedData,
        );
      }
      if (createRequestServicesDto.state === 'In Service') {
        const language = createRequestServicesDto?.metadata?.IsArabic ? 'ar' : 'en';
        if(createRequestServicesDto.type === 'Power Bank Request'){
          const message = SmsMessage[createRequestServicesDto.type][createRequestServicesDto.state][language];
          await this.smsService.sendSms(numbers, message, numbers);
        }
        if(createRequestServicesDto.type === 'Wheelchair & Stroller Request'){
          if(createRequestServicesDto.metadata.type === 'Wheelchair'){
            const message = SmsMessage['Wheelchair Request'][createRequestServicesDto.state][language];
            await this.smsService.sendSms(numbers, message, numbers);
          }
          if(createRequestServicesDto.metadata.type === 'Stroller'){
            const message = SmsMessage['Stroller Request'][createRequestServicesDto.state][language];
            await this.smsService.sendSms(numbers, message, numbers);
          }
        }

      }
      return savedService;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create added value service',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async addedValueServiceHandFree(createRequestServicesDto: any) {
    try {
      const numbers =
        createRequestServicesDto?.metadata?.customer?.phone_number;

      if (createRequestServicesDto.type === 'Handsfree Request') {
        await this.addedValueServiceHandler.checkExistingCases(
          createRequestServicesDto.type,
          numbers,
          'Bags Returned',
        );

        createRequestServicesDto.name = 'Added-Value Services';
        createRequestServicesDto.state = 'Pickup Requested';

        if(!createRequestServicesDto.metadata.pickUp){
          createRequestServicesDto.state = 'Bags Collected';
        }
        createRequestServicesDto =
          this.addedValueServiceHandler.setupHandsfreeRequestMetadata(
            createRequestServicesDto,
          );
      }

      await this.addedValueServiceHandler.handleCustomerCreation(
        createRequestServicesDto.metadata.customer,
      );

      const serviceData = this.requestServicesRepository.create(
        createRequestServicesDto,
      );
      const savedService = (await this.requestServicesRepository.save(
        serviceData,
      )) as unknown as RequestServices;

      if (savedService) {
        const transformedData = instanceToPlain(savedService);
        await this.elasticService.indexData(
          'services',
          savedService.id,
          transformedData,
        );
      }

      return savedService;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create added value service',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll(page, perPage, filterOptions) {
    page = page || 1;
    perPage = perPage || 10;
    const queryBuilder =
      this.requestServicesRepository.createQueryBuilder('user');

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

      Object.keys(filterOptions).forEach((key) => {
        if (key !== 'search' && filterOptions[key]) {
          queryBuilder.andWhere(`user.${key} = :${key}`, {
            [key]: filterOptions[key],
          });
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
    const RequestServices = await this.requestServicesRepository.findOne({
      where: { id: id },
    });
    if (!RequestServices) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }
    return RequestServices;
  }

  async findType(type: string) {
    const RequestServices = await this.requestServicesRepository.find({
      where: { type: type },
    });
    if (!RequestServices) {
      throw new NotFoundException(`Department with ID ${type} not found`);
    }
    return RequestServices;
  }

  async update(id: string, updateRequestServicesDto: UpdateRequestServicesDto) {
    const data = await this.findOneColumn(id);

    // Prevent manual change to 'Pending Internal' for Incident Reporting cases if 24 hours haven't passed
    if (
      data.type === 'Incident Reporting' &&
      data.state === 'Open' &&
      updateRequestServicesDto.state === 'Pending Internal'
    ) {
      // Only check time if this is a manual update (not from the cron job)
      if (
        !updateRequestServicesDto.metadata?.statusChangeReason ||
        updateRequestServicesDto.metadata.statusChangeReason !==
          'Automatic status change after 24 hours'
      ) {
        const now = moment();
        const createdAt = moment(data.createdAt);
        const hoursDifference = now.diff(createdAt, 'hours');

        if (hoursDifference < 24) {
          throw new HttpException(
            'Cannot change Incident Reporting status to Pending Internal. This status will be set automatically after 24 hours from case creation.',
            HttpStatus.BAD_REQUEST,
          );
        }
      }
    }

    if (
      data.state === 'Open' &&
      updateRequestServicesDto.state === 'Child Found' &&
      updateRequestServicesDto.type === 'Lost Child'
    ) {
      const numbers = data?.metadata?.parents?.phone_number;
      const language = updateRequestServicesDto?.metadata?.IsArabic
        ? 'ar'
        : 'en';
      const message =
        SmsMessage[updateRequestServicesDto.type][
          updateRequestServicesDto.state
        ][language];
      await this.smsService.sendSms(numbers, message, numbers);
    }
    if (
      updateRequestServicesDto.name === 'Gift Voucher Sales' &&
      updateRequestServicesDto.metadata &&
      updateRequestServicesDto.metadata.voucher
    ) {
      let totalValue = 0;
      for (
        let i = 0;
        i < updateRequestServicesDto.metadata.voucher.length;
        i++
      ) {
        const denomination = parseInt(
          updateRequestServicesDto.metadata.voucher[i].denominations,
        );

        // Count only vouchers that are not in "Refunded" state
        let countedVouchers = 0;
        for (
          let j = 0;
          j < updateRequestServicesDto.metadata.voucher[i].vouchers.length;
          j++
        ) {
          if (
            updateRequestServicesDto.metadata.voucher[i].vouchers[j].state !==
            'Refunded'
          ) {
            countedVouchers++;
          }
        }

        totalValue += denomination * countedVouchers;
      }
      updateRequestServicesDto.metadata.value = totalValue;
      console.log(
        'Recalculated voucher total value on update (excluding Refunded):',
        totalValue,
      );
    }

    if (
      data.state === 'Open' &&
      updateRequestServicesDto.state === 'Item Found' &&
      updateRequestServicesDto.type === 'Lost Item'
    ) {
      const numbers = data?.metadata?.parents?.phone_number;
      const language = updateRequestServicesDto?.metadata?.IsArabic
        ? 'ar'
        : 'en';
      const message =
        SmsMessage[updateRequestServicesDto.type][
          updateRequestServicesDto.state
        ][language];
      await this.smsService.sendSms(
        numbers,
        `Your Child Found Location : Floor : ${updateRequestServicesDto.metadata.location.floor}, Area : ${updateRequestServicesDto.metadata.location.tenant}`,
        numbers,
      );
    }
    if (
      updateRequestServicesDto.name === 'Gift Voucher Sales' &&
      updateRequestServicesDto.state === 'Sold' &&
      data.state === 'Pending'
    ) {
      const numbers =
        updateRequestServicesDto?.metadata?.customer?.phone_number ||
        updateRequestServicesDto?.metadata?.Company?.constact?.phone_number;
      const message = updateRequestServicesDto.metadata.isArabic
        ? 'عزيزي العميل، تم العثور على طفلكم وهو الآن في مكتب خدمة العملاء بالطابق الأرضي في سيتي مول. يُرجى إحضار هوية سارية لاستلام الطفل. لمزيد من المساعدة، يُرجى الاتصال على [رقم خدمة العمsلاء].'
        : 'Dears Customer, your child has been found and is safe at the Customer Care Desk on the Ground Floor of City Mall. Please bring a valid ID to collect your child.';
      await this.smsService.sendSms(numbers, message, numbers);
    }
    if (
      updateRequestServicesDto.type === 'Wheelchair & Stroller Request' &&
      updateRequestServicesDto.metadata.condition === 'Damaged' &&
      data.metadata.condition !== 'Damaged'
    ) {
      const numbers =
        updateRequestServicesDto?.metadata?.customer?.phone_number;
      const message = updateRequestServicesDto.metadata.isArabic
        ? 'السلعة تالفة، وفقًا للسياسة، يلزم دفع مبلغ 20 دينارًا أردنيًا'
        : 'The item is damaged. As per policy, a payment of 20 JDs is required';
      await this.smsService.sendSms(numbers, message, numbers);
    }

    if (updateRequestServicesDto?.actions === 'Awaiting Collection Child') {
      const numbers = updateRequestServicesDto?.metadata?.parents?.phone_number;
      const language = updateRequestServicesDto?.metadata?.IsArabic
        ? 'ar'
        : 'en';
      updateRequestServicesDto.state = 'Awaiting Collection';
      const message =
        SmsMessage[updateRequestServicesDto.type]['Awaiting Collection'][
          language
        ];
      await this.smsService.sendSms(numbers, message, numbers);
    }

    if (updateRequestServicesDto?.actions === 'Awaiting Collection Item') {
      console.log(updateRequestServicesDto.actions);
      const numbers =
        updateRequestServicesDto?.metadata?.customer?.phone_number;
      const language = updateRequestServicesDto?.metadata?.IsArabic
        ? 'ar'
        : 'en';
      updateRequestServicesDto.state = 'Awaiting Collection';
      const message =
        SmsMessage[updateRequestServicesDto.type]['Awaiting Collection'][
          language
        ];
      await this.smsService.sendSms(numbers, message, numbers);
    }

    if (updateRequestServicesDto?.actions === 'Send Damage SMS') {
      const numbers =
        updateRequestServicesDto?.metadata?.customer?.phone_number;
      const language = updateRequestServicesDto?.metadata?.IsArabic
        ? 'ar'
        : 'en';
      updateRequestServicesDto.metadata.sendDamageSms = true;
      let message = '';
      if (updateRequestServicesDto.type === 'Power Bank Request') {
        console.log(updateRequestServicesDto.metadata.condition);
        message =
          SmsMessage[updateRequestServicesDto.type][
            updateRequestServicesDto.metadata.condition
          ][language];
      } else {
        message = SmsMessage['Wheelchair Request']['Damaged'][language];
      }
      await this.smsService.sendSms(numbers, message, numbers);
    }

    if (updateRequestServicesDto?.actions === 'Awaiting Collection') {
      const numbers = updateRequestServicesDto?.metadata?.parents?.phone_number;
      const message = updateRequestServicesDto?.metadata?.IsArabic
        ? `Your Child Found Location : Floor : ${updateRequestServicesDto.metadata.location.floor}, Area : ${updateRequestServicesDto.metadata.location.tenant}`
        : `Your Child Found Location : Floor : ${updateRequestServicesDto.metadata.location.floor}, Area : ${updateRequestServicesDto.metadata.location.tenant}`;
      await this.smsService.sendSms(numbers, message, numbers);
    }

    if (
      updateRequestServicesDto?.actions === 'in_progress_item' ||
      updateRequestServicesDto?.actions === 'ArticleFound'
    ) {
      const numbers =
        updateRequestServicesDto?.metadata?.customer?.phone_number;
      const language = updateRequestServicesDto?.metadata?.IsArabic
        ? 'ar'
        : 'en';
      if (updateRequestServicesDto?.actions === 'ArticleFound') {
        const message =
          SmsMessage[updateRequestServicesDto.type]['Article Found'][language];
        await this.smsService.sendSms(
          numbers,
          `${message}\nhttps://main.d3n0sp6u84gnwb.amplifyapp.com/#/services/${data.id}/rating`,
          numbers,
        );
      } else {
        const message =
          SmsMessage[updateRequestServicesDto.type]['In Progress'][language];
        await this.smsService.sendSms(numbers, message, numbers);
      }
    }
    if (updateRequestServicesDto?.actions === 'in_progress_item_3') {
      const numbers =
        updateRequestServicesDto?.metadata?.customer?.phone_number;
      const language = updateRequestServicesDto?.metadata?.IsArabic
        ? 'ar'
        : 'en';
      const message =
        SmsMessage[updateRequestServicesDto.type]['In Progress Day 3'][
          language
        ];
      await this.smsService.sendSms(numbers, message, numbers);
    }
    if (updateRequestServicesDto?.actions === 'in_progress_item_7') {
      const numbers =
        updateRequestServicesDto?.metadata?.customer?.phone_number;
      const language = updateRequestServicesDto?.metadata?.IsArabic
        ? 'ar'
        : 'en';
      const message =
        SmsMessage[updateRequestServicesDto.type]['Article Not Found'][
          language
        ];
      await this.smsService.sendSms(numbers, `${message}\nhttps://main.d3n0sp6u84gnwb.amplifyapp.com/#/services/${data.id}/rating`, numbers);
    }
    if (updateRequestServicesDto?.actions === 'refunded_voucher') {
      const numbers =
        data?.metadata?.customer?.phone_number ||
        data?.metadata?.Company?.phone_number;
      const language = updateRequestServicesDto?.metadata?.IsArabic
        ? 'ar'
        : 'en';
      const message =
        SmsMessage[updateRequestServicesDto.type]['Refunded'][language];
      await this.smsService.sendSms(
        numbers,
        `${message}https://main.d3n0sp6u84gnwb.amplifyapp.com/#/services/${data.id}/rating`,
        numbers,
      );
    }
    if (updateRequestServicesDto?.actions === 'Refunded') {
      const numbers =
        data?.metadata?.customer?.phone_number ||
        data?.metadata?.Company?.phone_number;
      const message = updateRequestServicesDto?.metadata?.IsArabic
        ? `Your Child Found Location : Floor : ${updateRequestServicesDto.metadata.location.floor}, Area : ${updateRequestServicesDto.metadata.location.tenant}`
        : `Your Child Found Location : Floor : ${updateRequestServicesDto.metadata.location.floor}, Area : ${updateRequestServicesDto.metadata.location.tenant}`;
      await this.smsService.sendSms(numbers, message, numbers);
    }
    if (updateRequestServicesDto?.actions === 'In Service') {
      const numbers = data?.metadata?.customer?.phone_number;
      const language = updateRequestServicesDto?.metadata?.IsArabic
        ? 'ar'
        : 'en';
      const message =
        SmsMessage[updateRequestServicesDto.type][
          updateRequestServicesDto.state
        ][language];
      await this.smsService.sendSms(numbers, message, numbers);
    }

    // Handle Wheelchair & Stroller Request
    if (updateRequestServicesDto.type === 'Wheelchair & Stroller Request') {
      if (updateRequestServicesDto.metadata.type === 'Wheelchair') {
        await this.wheelchairStrollerHandler.handleWheelchairRequest(
          updateRequestServicesDto,
          id,
        );
      } else if (updateRequestServicesDto.metadata.type === 'Stroller') {
        await this.wheelchairStrollerHandler.handleStrollerRequest(
          updateRequestServicesDto,
          id,
        );
      }
    }

    // Handle Power Bank Request
    if (updateRequestServicesDto.type === 'Power Bank Request') {
      await this.powerBankHandler.handlePowerBankRequest(
        updateRequestServicesDto,
        id,
      );
    }

    // Handle Handsfree Request
    if (updateRequestServicesDto.type === 'Handsfree Request') {
      await this.handsfreeHandler.handleHandsfreeRequest(
        updateRequestServicesDto,
        id,
      );
    }

    if (
      data.state !== 'Closed' &&
      updateRequestServicesDto.state === 'Closed'
    ) {
      if (
        data.type === 'Incident Reporting' &&
        data.state === 'Pending Internal'
      ) {
        const now = moment();
        const createdAt = moment(data.createdAt);
        const hoursDifference = now.diff(createdAt, 'hours');
        if (
          hoursDifference < 24 ||
          !updateRequestServicesDto.metadata?.callCompleted
        ) {
          throw new HttpException(
            'Cannot close incident case. Must wait 24 hours and mark call as completed.',
            HttpStatus.BAD_REQUEST,
          );
        }
      }
      const numbers =
        data?.metadata?.parents?.phone_number ||
        data?.metadata?.customer?.phone_number ||
        data?.metadata?.Company?.constact?.phone_number ||
        updateRequestServicesDto?.metadata?.parents?.phone_number;
      const language = updateRequestServicesDto?.metadata?.IsArabic
        ? 'ar'
        : 'en';
      const message =
        SmsMessage[updateRequestServicesDto.type][
          updateRequestServicesDto.state
        ][language];
      if (
        updateRequestServicesDto.type === 'Found Child' ||
        updateRequestServicesDto.type === 'Lost Child'
      ) {
        const messageFound = updateRequestServicesDto.metadata.IsArabic ?  message + `\nhttps://main.d3n0sp6u84gnwb.amplifyapp.com/#/services/${data.id}/rating\n "نتمنى لكم السلامة"` : message + `\nhttps://main.d3n0sp6u84gnwb.amplifyapp.com/#/services/${data.id}/rating\n "Stay Safe" from City Mall`;
        await this.smsService.sendSms(
          numbers,
          `${messageFound}`,
          numbers,
        );
      } else {
        await this.smsService.sendSms(
          numbers,
          `${message}\nhttps://main.d3n0sp6u84gnwb.amplifyapp.com/#/services/${data.id}/rating`,
          numbers,
        );
      }
    }
    console.log(JSON.stringify(updateRequestServicesDto));
    await this.requestServicesRepository.update(id, updateRequestServicesDto);
    await this.elasticService.updateDocument(
      'services',
      id,
      updateRequestServicesDto,
    );
    return this.requestServicesRepository.findOne({ where: { id } });
  }

  async rating(id: string, rate: any) {
    try {
      const data = await this.findOneColumn(id);

      // If we found the service request, update its rating
      data.rating = rate.rating;
      await this.requestServicesRepository.update(id, data);
      await this.elasticService.updateDocument('services', id, data);
      return this.findOne(id);
    } catch (error) {
      // If findOneColumn fails, try to find a complaint instead
      try {
        const complaint = await this.complaintsService.findOne(id);
        if (complaint) {
          // Don't directly update from here - use the complaint service's rating method
          // but we need to handle potential errors there as well
          try {
            return await this.complaintsService.rating(id, rate);
          } catch (ratingError) {
            console.error(
              'Error updating complaint rating:',
              ratingError.message,
            );

            // Try to update using our own implementation that handles multiple primary keys
            complaint.rating = rate.rating;

            // Use the ElasticSearch update instead of direct repository update
            try {
              await this.elasticService.updateDocument('complaints', id, {
                rating: rate.rating,
              });
              return await this.complaintsService.findOne(id);
            } catch (elasticError) {
              console.error(
                'Error updating complaint in ElasticSearch:',
                elasticError.message,
              );
              // Return the complaint object with updated rating even if we couldn't save it
              return complaint;
            }
          }
        }
      } catch (complaintError) {
        // If both checks fail, throw a not found exception
        throw new HttpException('Case not found', HttpStatus.NOT_FOUND);
      }
    }
  }

  async remove(id: string) {
    const RequestServices = await this.findOneColumn(id);
    await this.requestServicesRepository.remove(RequestServices);
  }
}
