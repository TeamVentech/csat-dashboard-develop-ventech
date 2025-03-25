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
          await this.sendSms(
            numbers,
            `${message}https://main.d3n0sp6u84gnwb.amplifyapp.com/#/services/${savedService.id}/rating`,
            numbers,
          );
        }
      } else {
        if (createRequestServicesDto.type === 'Found Child') {
          if (createRequestServicesDto.metadata.parents.phone_number) {
            const numbers =
              createRequestServicesDto?.metadata?.parents?.phone_number;
            const message = createRequestServicesDto.metadata.isArabic
              ? 'تم العثور على طفلكم المفقود.\n يرجى التوجه لمكتب خدمة الزبائن في الطابق الأرضي لاستلام الطفل وإبراز هويتكم.'
              : 'Dear Customer,\n Your missing child was found. Please head immediately to Customer Care desk at Ground Floor to collect child and present your ID.';
            await this.sendSms(numbers, message, numbers);
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
          await this.sendSms(numbers, message, numbers);
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
      const numbers = createRequestServicesDto?.metadata?.customer?.phone_number
      if (createRequestServicesDto.type !== 'Handsfree Request') {
        let VoucherType = null;
        let Service_data = null;
        createRequestServicesDto.name = 'Added-Value Services';
        createRequestServicesDto.state = 'In Service';
        
        if (createRequestServicesDto.metadata.delivery) {
          createRequestServicesDto.state = 'Delivery Requested';
        }

        if (createRequestServicesDto.type === 'Wheelchair & Stroller Request') {
          VoucherType = createRequestServicesDto.metadata.type;
        }
        if (createRequestServicesDto.type === 'Power Bank Request') {
          VoucherType = 'Power Bank';
        }
        
        Service_data = await this.servicesService.findOneByTypeStatus(
          VoucherType,
          'AVAILABLE',
        );
        
        if (!Service_data) {
          const payload = {
            type: VoucherType,
            status: 'AVAILABLE',
            addedBy: 'system',
            numbers: 1,
          };
          Service_data = await this.servicesService.create(payload);
        }
        
        createRequestServicesDto.metadata.service = Service_data;
        await this.servicesService.update(Service_data.id, {
          status: 'OCCUPIED',
        });
      }

      const customers = createRequestServicesDto.metadata.customer;
      const customer = await this.customerService.doesEmailOrPhoneExist(
        customers.email,
        customers.phone_number,
      );
      
      if (customer) {
        await this.customerService.update(customer.id, { ...customers });
      } else {
        const customerData = { ...customers };
        delete customerData.id;
        await this.customerService.create(customerData);
      }

      const serviceData = this.requestServicesRepository.create(createRequestServicesDto);
      const savedService = await this.requestServicesRepository.save(serviceData);
      
      if (savedService) {
        const transformedData = instanceToPlain(savedService);
        await this.elasticService.indexData('services', savedService.id, transformedData);
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

  // Update a department by IDsdd
  async update(id: string, updateRequestServicesDto: any) {
    await this.findOne(id);

    // If this is a voucher service, recalculate the total value
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

    await this.requestServicesRepository.update(id, updateRequestServicesDto);
    await this.elasticService.updateDocument(
      'services',
      id,
      updateRequestServicesDto,
    );
    return this.findOne(id);
  }

  async rating(id: string, rate: any) {
    const data = await this.findOneColumn(id);
    data.rating = rate.rating;
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
    const numbers = number;
    const accName = 'CityMall';
    const accPass = 'G_PAXDujRvrw_KoD';

    const smsUrl = `https://josmsservice.com/SMSServices/Clients/Prof/RestSingleSMS_General/SendSMS`;
    const response = await axios.get(smsUrl, {
      params: {
        senderid: senderId,
        numbers: numbers,
        accname: accName,
        AccPass: accPass,
        msg: encodeURIComponent(message),
      },
    });
  }
}
