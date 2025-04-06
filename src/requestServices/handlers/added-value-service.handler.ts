import { Injectable } from '@nestjs/common';
import { ElasticService } from 'ElasticSearch/elasticsearch.service';
import { ServicesService } from 'service/services.service';
import { CustomersService } from 'customers/customers.service';
import { AddedValueServiceDto } from '../dto/added-value-service.dto';
import { HttpException, HttpStatus } from '@nestjs/common';

@Injectable()
export class AddedValueServiceHandler {
  constructor(
    private readonly elasticService: ElasticService,
    private readonly servicesService: ServicesService,
    private readonly customerService: CustomersService,
  ) {}

  async checkExistingCases(type: string, phoneNumber: string, stateToCheck: string) {
    const existingCases = await this.elasticService.searchByQuery('services', {
      query: {
        bool: {
          must: [
            { match: { type } },
            { match: { 'metadata.customer.phone_number': phoneNumber } },
          ],
          must_not: [
            { match: { state: stateToCheck } }
          ]
        }
      }
    });

    if (existingCases.totalHits > 0) {
      throw new HttpException(
        'You already have a case that is not closed',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  async handleServiceAvailability(createRequestServicesDto: AddedValueServiceDto) {
    let VoucherType = null;
    
    if (createRequestServicesDto.type === 'Wheelchair & Stroller Request') {
      VoucherType = createRequestServicesDto.metadata.type;
    }
    if (createRequestServicesDto.type === 'Power Bank Request') {
      VoucherType = 'Power Bank';
    }

    let Service_data = await this.servicesService.findOneByTypeStatus(
      VoucherType,
      'AVAILABLE',
    );

    if (!Service_data) {
      const payload = {
        type: VoucherType,
        status: 'TEMPORARY',
        addedBy: 'system',
        numbers: 1,
      };
      Service_data = await this.servicesService.create(payload);
    }
    else{
        await this.servicesService.update(Service_data.id, {
            status: 'OCCUPIED',
        }); 
    }


    return Service_data;
  }

  async handleCustomerCreation(customers: any) {
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
  }

  setupHandsfreeRequestMetadata(createRequestServicesDto: any) {
    if (!createRequestServicesDto.metadata) {
      createRequestServicesDto.metadata = {
        IsArabic: false,
        customer: null,
        delivery: false,
        pickUp: false,
        request_source: 'Hotline',
        actions: {
          custoemr_collect: false
        },
        type: 'Handsfree Request'
      };
    }
    
    // Ensure required fields are present
    createRequestServicesDto.metadata.IsArabic = createRequestServicesDto.metadata.IsArabic || false;
    createRequestServicesDto.metadata.delivery = createRequestServicesDto.metadata.delivery || false;
    createRequestServicesDto.metadata.pickUp = createRequestServicesDto.metadata.pickUp || false;
    createRequestServicesDto.metadata.request_source = createRequestServicesDto.metadata.request_source || 'Hotline';
    createRequestServicesDto.metadata.actions = createRequestServicesDto.metadata.actions || {
      custoemr_collect: false
    };
    
    // Set default dates and times
    const today = new Date();
    if (createRequestServicesDto.metadata.pickUp) {
      if (!createRequestServicesDto.metadata.pickupDate) {
        createRequestServicesDto.metadata.pickupDate = today.toISOString().split('T')[0];
      }
      if (!createRequestServicesDto.metadata.pickupTime) {
        createRequestServicesDto.metadata.pickupTime = today.toTimeString().slice(0, 5);
      }
      if (!createRequestServicesDto.metadata.pickupLocation) {
        createRequestServicesDto.metadata.pickupLocation = {
          id: '',
          floor: '',
          tenant: ''
        };
      }
    }

    if (createRequestServicesDto.metadata.delivery) {
      if (!createRequestServicesDto.metadata.deliveryDate) {
        createRequestServicesDto.metadata.deliveryDate = today.toISOString().split('T')[0];
      }
      if (!createRequestServicesDto.metadata.deliveryTime) {
        createRequestServicesDto.metadata.deliveryTime = today.toTimeString().slice(0, 5);
      }
      if (!createRequestServicesDto.metadata.deliveryLocation) {
        createRequestServicesDto.metadata.deliveryLocation = {
          id: '',
          floor: '',
          tenant: ''
        };
      }
    }

    return createRequestServicesDto;
  }
} 