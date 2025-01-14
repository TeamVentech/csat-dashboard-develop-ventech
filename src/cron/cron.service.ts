import { Injectable, OnModuleInit } from '@nestjs/common';
import { getRepository } from 'typeorm';
import { RequestServices } from '../requestServices/entities/requestServices.entity';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Raw, LessThan } from 'typeorm';
import axios from 'axios';
import { ElasticService } from 'ElasticSearch/elasticsearch.service';


@Injectable()
export class CronService {
  constructor(
    @InjectRepository(RequestServices)
    private readonly requestServicesRepo: Repository<RequestServices>,
    private readonly elasticService: ElasticService,
  ) { }

  // This will run every day at 10:00 AM
  @Cron('* 10 * * *', { timeZone: 'Asia/Amman' })
  async handleDailyJob() {
    console.log('Running daily check for expiring vouchers at 10:00 AM');
    const expiringServices = await this.elasticService.searchExpiringSoon("services")

    // find({
    //   where: {
    //     name: 'Gift Voucher Sales',
    //     state: 'Sold',
    //     metadata: Raw(
    //       (alias) =>
    //         `metadata->>'Expiry_date' IS NOT NULL AND metadata->>'Expiry_date' <> '' AND (metadata->>'Expiry_date')::timestamp >= :currentDate AND (metadata->>'Expiry_date')::timestamp <= :oneWeekLater`,
    //       {
    //         currentDate: currentDate.toISOString(),
    //         oneWeekLater: oneWeekLater.toISOString(),
    //       },
    //     ),
    //   },
    // });


    console.log(expiringServices)

    expiringServices.results.forEach(async(service) => {
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
