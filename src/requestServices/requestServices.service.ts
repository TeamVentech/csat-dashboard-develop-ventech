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

  // Helper method to handle customer data
  private async handleCustomerData(customerData: any) {
    if (!customerData || (!customerData.email && !customerData.phone_number)) {
      return;
    }

    try {
      // First check if customer exists by email
      let customer = null;
      if (customerData.email) {
        customer = await this.customerService.doesEmailOrPhoneExist(
          customerData.email,
          null,
        );

        // If customer exists with the same email, check phone number match
        if (customer && customerData.phone_number) {
          if (customer.phone_number !== customerData.phone_number) {
            // Phone number is different - throw error to stop execution
            throw new HttpException(
              'Cannot update phone number for existing customer. Phone number must remain the same.',
              HttpStatus.BAD_REQUEST
            );
          }

          // Phone numbers match, proceed with update
          await this.customerService.update(customer.id, { ...customerData });
          return;
        }
      }

      // If no match by email, check by phone number
      if (customerData.phone_number) {
        customer = await this.customerService.doesEmailOrPhoneExist(
          null,
          customerData.phone_number,
        );

        if (customer) {
          // If customer exists with different email, check if trying to change email
          if (customerData.email && customer.email !== customerData.email) {
            throw new HttpException(
              'Cannot update email for existing customer with this phone number.',
              HttpStatus.BAD_REQUEST
            );
          }

          // No email change, proceed with update
          await this.customerService.update(customer.id, { ...customerData });
        } else {
          // Customer doesn't exist, create a new one
          delete customerData?.id;
          await this.customerService.create({ ...customerData });
        }
      }
    } catch (error) {
      // Re-throw HttpException errors but wrap other errors
      if (error instanceof HttpException) {
        throw error;
      } else {
        console.error('Error handling customer data:', error);
        throw new HttpException(
          'Error processing customer data',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    }
  }

  async create(createRequestServicesDto: CreateRequestServicesDto) {
    console.log(createRequestServicesDto)
    let Service;
    let savedService;

    // Get a query runner to manage transactions
    const queryRunner = this.requestServicesRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const numbers =
        createRequestServicesDto?.metadata?.parents?.phone_number ||
        createRequestServicesDto?.metadata?.customer?.phone_number ||
        createRequestServicesDto?.metadata?.Company?.phone_number;

      // Process customer data for any service type that includes customer data
      if (createRequestServicesDto?.metadata?.customer) {
        await this.handleCustomerData(createRequestServicesDto.metadata.customer);
      }

      // Process parents data for lost children services
      if (createRequestServicesDto?.metadata?.parents) {
        await this.handleCustomerData(createRequestServicesDto.metadata.parents);
      }

      if (createRequestServicesDto.type === 'Incident Reporting') {
        createRequestServicesDto.state = 'Open';
        if(createRequestServicesDto.metadata.Incident.outcome === 'Resolved'){
          // Check if solve_date is not in the future
          const solveDate = new Date(createRequestServicesDto.metadata.time_solved);
          const currentDate = new Date();

          if(solveDate > currentDate) {
            throw new HttpException(
              'Solve date cannot be in the future',
              500
            );
          }
        }
        if (!createRequestServicesDto.metadata) {
          createRequestServicesDto.metadata = {};
        }
        createRequestServicesDto.metadata.reportedAt = new Date();
        createRequestServicesDto.metadata.statusChangeExpectedAt = moment()
          .add(24, 'hours')
          .toDate();
      }

      if (createRequestServicesDto.name === 'Gift Voucher Sales') {
        // Create service instance but don't save it yet
        Service = this.requestServicesRepository.create(
          createRequestServicesDto,
        );
        savedService = await queryRunner.manager.save(Service);

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

        // Resave the service with updated total value
        savedService = await queryRunner.manager.save(Service);

        // Update vouchers first - if this fails, we won't save the service
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
            Service.metadata.voucher[i].vouchers[j].metadata.transactionSubId =
            savedService.serviceId;
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

        // Try to index in Elasticsearch
        try {
          await this.elasticService.indexData('services', savedService.id, savedService);
        } catch (elasticError) {
          // If Elasticsearch indexing fails, roll back the transaction
          await queryRunner.rollbackTransaction();
          throw new HttpException(
            'Failed to index service in Elasticsearch',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }

        // SMS is now sent only after both database and Elasticsearch operations succeed
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
        // Create and save the service
        Service = this.requestServicesRepository.create(
          createRequestServicesDto,
        );



        // Save using transaction
        savedService = await queryRunner.manager.save(Service);
        // Try to index in Elasticsearch
        try {
          const transformedData = instanceToPlain(savedService);
          await this.elasticService.indexData(
            'services',
            savedService.id,
            transformedData,
          );
        } catch (elasticError) {
          // If Elasticsearch indexing fails, roll back the transaction
          await queryRunner.rollbackTransaction();
          throw new HttpException(
            'Failed to index service in Elasticsearch',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }

        // Send SMS messages only after both database and Elasticsearch operations succeed
        if (createRequestServicesDto.type === 'Found Child') {
          if (createRequestServicesDto.metadata.parents.phone_number) {
            const numbers =
              createRequestServicesDto?.metadata?.parents?.phone_number;
            const message = createRequestServicesDto.metadata.IsArabic
              ? 'تم العثور على طفلكم تم العثور على طفلكم المفقود.\n يرجى التوجه لمكتب خدمة الزبائن في الطابق الأرضي لاستلام الطفل وإبراز هويتكم.'
              : 'Dear Customer,\n Your missing child was found. Please head immediately to Customer Care desk at Ground Floor to collect child and present your ID.';
            await this.smsService.sendSms(numbers, message, numbers);
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
      }

      // If everything is successful, commit the transaction
      await queryRunner.commitTransaction();

    } catch (error) {
      // Roll back the transaction on any error
      await queryRunner.rollbackTransaction();
      console.error('Error in service creation flow:', error.message);
      throw new HttpException(
        error.message || 'Failed to create service',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      // Release the query runner
      await queryRunner.release();
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
      if(createRequestServicesDto.state === 'Bags Collected'){
        const number = createRequestServicesDto.metadata.customer.phone_number;
        const language = createRequestServicesDto?.metadata?.IsArabic ? 'ar' : 'en';
        const message = SmsMessage[createRequestServicesDto.type][createRequestServicesDto.state][language];
        await this.smsService.sendSms(number, message, number);
        // serviceData.state = 'In Service';
      }
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
    }

    if (
      data.state === 'Open' &&
      updateRequestServicesDto.state === 'Item Found' &&
      updateRequestServicesDto.type === 'Lost Item'
    ) {
      const numbers = data?.metadata?.parents?.phone_number;
      if (updateRequestServicesDto.type === 'Lost Item') {
        const customers = updateRequestServicesDto.metadata.customer;
        const customer = await this.customerService.doesEmailOrPhoneExist(
          customers.email,
          customers.phone_number,
        );
        if (customer) {
          await this.customerService.update(customer.id, { ...customers });
        } else {
          delete updateRequestServicesDto?.metadata?.customer?.id;
          await this.customerService.create({
            ...updateRequestServicesDto.metadata.customer,
          });
        }

      }
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
      const numbers =
        updateRequestServicesDto?.metadata?.customer?.phone_number;
      const language = updateRequestServicesDto?.metadata?.IsArabic
        ? 'ar'
        : 'en';
      if(updateRequestServicesDto.state !== 'Awaiting Collection'){
        updateRequestServicesDto.state = 'Awaiting Collection';
        const message =
          SmsMessage[updateRequestServicesDto.type]['Awaiting Collection'][
            language
          ];
        await this.smsService.sendSms(numbers, message, numbers);

      }
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
        updateRequestServicesDto.metadata.closedAt = new Date();
        await this.wheelchairStrollerHandler.handleWheelchairRequest(
          updateRequestServicesDto,
          id,
        );
      } else if (updateRequestServicesDto.metadata.type === 'Stroller') {
        updateRequestServicesDto.metadata.closedAt = new Date();
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
        data.type === 'Incident Reporting'
      ) {
        updateRequestServicesDto.metadata.closedAt = new Date();
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
        const messageFound = updateRequestServicesDto.metadata.IsArabic ?  message + `\nhttps://main.d3n0sp6u84gnwb.amplifyapp.com/#/services/${data.id}/rating\n نتمنى سلامتكم` : message + `\nhttps://main.d3n0sp6u84gnwb.amplifyapp.com/#/services/${data.id}/rating\n "Stay Safe" from City Mall`;
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
	try{
    await this.requestServicesRepository.update(id, updateRequestServicesDto);
    await this.elasticService.updateDocument(
      'services',
      id,
      updateRequestServicesDto,
    );
    return this.requestServicesRepository.findOne({ where: { id } });
	} catch (error) {
		console.error('Error in update method:', error.message);
		throw new HttpException(
			error.message || 'Failed to update service',
			HttpStatus.INTERNAL_SERVER_ERROR,
		);
	}
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

  /**
   * Checks if a customer has active services of a specific type
   * @param type Service type to check (e.g., 'Handsfree Request', 'Wheelchair & Stroller Request', 'Power Bank Request')
   * @param phoneNumber Customer's phone number
   * @returns Object with hasActiveService flag and serviceDetails if applicable
   */
  async checkActiveServicesByType(type: string, phoneNumber: string) {
    try {
      // Determine the completed state based on service type
	    let completedState = ['Closed'];

      if (type === 'Handsfree Request') {
	      completedState = ['Bags Returned'];
      } else if (type === 'Wheelchair & Stroller Request' || type === 'Power Bank Request') {
	      completedState = ['Item Returned', 'Item not Returned', 'Item Not Returned', 'Closed'];
      }

      // Query Elasticsearch for active services of the specified type
      const activeServices = await this.elasticService.searchByQuery('services', {
        query: {
          bool: {
            must: [
              { match: { 'type.keyword': type } },
              { match: { 'metadata.customer.phone_number': phoneNumber } },
            ],
            must_not: [
              { terms: { 'state.keyword': completedState } }
            ]
          }
        }
      });

      if (activeServices.totalHits > 0) {
        // Customer has active services
        return {
          hasActiveService: true,
          serviceDetails: activeServices.results[0] || null, // Return the first active service's data
          totalActiveServices: activeServices.totalHits
        };
      }

      // No active services found
      return {
        hasActiveService: false,
        serviceDetails: null,
        totalActiveServices: 0
      };
    } catch (error) {
      console.error('Error checking active services:', error);
      throw new HttpException(
        'Failed to check active services',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async remove(id: string) {
    const RequestServices = await this.findOneColumn(id);
    await this.requestServicesRepository.remove(RequestServices);
  }
}
