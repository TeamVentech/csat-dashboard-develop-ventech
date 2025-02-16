import { Injectable, OnModuleInit } from '@nestjs/common';
import { getRepository } from 'typeorm';
import { RequestServices } from '../requestServices/entities/requestServices.entity';
// import { Cron } from '@nestjs/schedule';
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

  // @Cron('0 22 * * *', { timeZone: 'Asia/Amman' })
  // async handleDailyJobs() {
  //   console.log('Running daily check for expiring vouchers at 10:00 AM');    
  //   const expiringServices = await this.elasticService.searchInServiceState("services")

  // }
  // @Cron('0 10 * * *', { timeZone: 'Asia/Amman' })
  // async handleDailyJob() {
  //   console.log('Running daily check for expiring vouchers at 10:00 AM');
  //   const expiringServices = await this.elasticService.searchExpiringSoon("services")
  //   expiringServices.results.forEach(async (service) => {
  //     const senderId = 'City Mall';
  //     const numbers = service?.metadata?.customer?.phone_number || service?.metadata?.Company?.constact?.phone_number
  //     const accName = 'CityMall';
  //     const accPass = 'G_PAXDujRvrw_KoD';
  //     const msg = "Your Voucher will done after 1 Week ";

  //     const smsUrl = `https://josmsservice.com/SMSServices/Clients/Prof/RestSingleSMS_General/SendSMS`;
  //     const response = await axios.get(smsUrl, {
  //       params: {
  //         senderid: senderId,
  //         numbers: numbers,
  //         accname: accName,
  //         AccPass: accPass,
  //         msg: msg,
  //       },
  //     });
  //   });
  // }
}
