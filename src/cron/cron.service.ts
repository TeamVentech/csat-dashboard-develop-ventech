import { Injectable, OnModuleInit } from '@nestjs/common';
import { getRepository } from 'typeorm';
import { RequestServices } from '../requestServices/entities/requestServices.entity';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Raw, LessThan } from 'typeorm';
import axios from 'axios';


@Injectable()
export class CronService {
  constructor(
    @InjectRepository(RequestServices)
    private readonly requestServicesRepo: Repository<RequestServices>,
  ) { }

  // This will run every day at 10:00 AM
  @Cron('* 13 * * *', { timeZone: 'Asia/Amman' })
  async handleDailyJob() {
    console.log('Running daily check for expiring vouchers at 10:00 AM');

    const currentDate = new Date();
    const oneWeekLater = new Date();
    oneWeekLater.setDate(currentDate.getDate() + 7);


    const expiringServices = await this.requestServicesRepo.find({
      where: {
        name: 'Gift Voucher Sales',
        state: 'Sold',
        metadata: Raw(
          (alias) =>
            `metadata->>'Expiry_date' IS NOT NULL AND metadata->>'Expiry_date' <> '' AND (metadata->>'Expiry_date')::timestamp >= :currentDate AND (metadata->>'Expiry_date')::timestamp <= :oneWeekLater`,
          {
            currentDate: currentDate.toISOString(),
            oneWeekLater: oneWeekLater.toISOString(),
          },
        ),
      },
    });




    expiringServices.forEach(async(service) => {
      const senderId = 'City Mall';
      console.log(service)
      const numbers = service?.metadata?.customer?.phone_number || service?.metadata?.Company?.constact?.phone_number 
      const accName = 'CityMall';
      console.log(numbers)
      const accPass = 'G_PAXDujRvrw_KoD';
      const msg = "Your Voucher will done after 1 Week ";

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


    });

  }
}
