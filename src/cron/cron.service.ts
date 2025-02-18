import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { ElasticService } from 'ElasticSearch/elasticsearch.service';
import { RequestServices } from 'requestServices/entities/requestServices.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(RequestServices)
    private readonly requestServicesRepo: Repository<RequestServices>,
    private readonly elasticService: ElasticService,
  ) { }


  @Cron(CronExpression.EVERY_10_HOURS)
  async handleCron() {
    console.log('30');
    const status =  "Closed" 
    const page =  1
    const per_page = 10
    // const complaint_tasks = await this.elasticService.searchComplaintTask("tasks",status, page, per_page)
    // console.log(complaint_tasks)
  }
}
// import { Injectable, OnModuleInit } from '@nestjs/common';
// import * as crypto from 'crypto';
// import { getRepository } from 'typeorm';
// import { RequestServices } from '../requestServices/entities/requestServices.entity';
// import { Cron } from '@nestjs/schedule';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository, Raw, LessThan } from 'typeorm';
// import axios from 'axios';
// import { ElasticService } from 'ElasticSearch/elasticsearch.service';

// @Injectable()
// export class CronService {
//   constructor(
//     @InjectRepository(RequestServices)
//     private readonly requestServicesRepo: Repository<RequestServices>,
//     private readonly elasticService: ElasticService,
//   ) { }

//   // @Cron('0 22 * * *', { timeZone: 'Asia/Amman' })
//   // async handleDailyJobs() {
//   //   console.log('Running daily check for expiring vouchers at 10:00 AM');
//   //   const expiringServices = await this.elasticService.searchInServiceState("services")
//   // }
//   @Cron('0 * * * * *') // Runs at the start of every hour
//   handleCron() {
//     console.log('This function runs every hour!');
//     // Your logic here
//   }
//   // @Cron('0 10 * * *', { timeZone: 'Asia/Amman' })
//   // async handleDailyJob() {
//   //   console.log('Running daily check for expiring vouchers at 10:00 AM');
//   //   const expiringServices = await this.elasticService.searchExpiringSoon("services")
//   //   expiringServices.results.forEach(async (service) => {
//   //     const senderId = 'City Mall';
//   //     const numbers = service?.metadata?.customer?.phone_number || service?.metadata?.Company?.constact?.phone_number
//   //     const accName = 'CityMall';
//   //     const accPass = 'G_PAXDujRvrw_KoD';
//   //     const msg = "Your Voucher will done after 1 Week ";

//   //     const smsUrl = `https://josmsservice.com/SMSServices/Clients/Prof/RestSingleSMS_General/SendSMS`;
//   //     const response = await axios.get(smsUrl, {
//   //       params: {
//   //         senderid: senderId,
//   //         numbers: numbers,
//   //         accname: accName,
//   //         AccPass: accPass,
//   //         msg: msg,
//   //       },
//   //     });
//   //   });
//   // }
// }
