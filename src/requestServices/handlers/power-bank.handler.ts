import { Injectable } from '@nestjs/common';
import { ServicesService } from 'service/services.service';
import { UpdateRequestServicesDto } from '../dto/update.dto';
import SmsMessage from '../messages/smsMessages';
import { SmsService } from '../services/sms.service';

@Injectable()
export class PowerBankHandler {
  constructor(
    private readonly servicesService: ServicesService,
    private readonly smsService: SmsService,
  ) {}

  async handlePowerBankRequest(
    updateRequestServicesDto: UpdateRequestServicesDto,id:string
  ) {
    const { actions, metadata } = updateRequestServicesDto;
    const numbers = metadata?.customer?.phone_number;
    const language = metadata?.IsArabic ? 'ar' : 'en';

    switch (actions) {
      case 'out_for_delivery':
        await this.handleOutForDelivery(numbers, language,id);
        break;
      case 'En_Route_Pickup':
        await this.handleEnRoutePickup(numbers, language,id);
        break;
      case 'In_Service_Whileechair':
        await this.handleInService(numbers, language,id);
        break;
      case 'Item_Returned':
        await this.handleItemReturned(updateRequestServicesDto,id);
        break;
    }
  }

  private async handleOutForDelivery(numbers: string, language: string,id:string) {
    const message = SmsMessage['Power Bank Request']['Out for Delivery'][language];
    await this.smsService.sendSms(numbers, message, numbers);
  }

  private async handleEnRoutePickup(numbers: string, language: string,id:string) {
    const message = SmsMessage['Power Bank Request']['En Route for Pickup'][language];
    await this.smsService.sendSms(numbers, message, numbers);
  }

  private async handleInService(numbers: string, language: string,id:string) {
    const message = SmsMessage['Power Bank Request']['In Service'][language];
    await this.smsService.sendSms(numbers, message, numbers);
  }

  private async handleItemReturned(updateRequestServicesDto: UpdateRequestServicesDto,id:string) {
    const { metadata, metadata: { customer: { phone_number: numbers }, IsArabic } } = updateRequestServicesDto;
    const language = IsArabic ? 'ar' : 'en';

    if (metadata?.service?.id) {
      await this.servicesService.update(metadata.service.id, { status: 'AVAILABLE' });
    } else {
      console.warn('Cannot update service status: service ID is undefined');
    }

    const message = SmsMessage['Power Bank Request']['Item Returned'][language];
    await this.smsService.sendSms(numbers,  `${message}\nhttps://main.d3n0sp6u84gnwb.amplifyapp.com/#/services/${id}/rating`, numbers);
  }
} 