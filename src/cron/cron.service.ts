import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { ElasticService } from 'ElasticSearch/elasticsearch.service';
import { RequestServices } from 'requestServices/entities/requestServices.entity';
import { Repository } from 'typeorm';
import * as moment from 'moment';
import { TasksServices } from 'userTask/task.service';
import { Tasks } from 'userTask/entities/task.entity';
import { ComplaintsService } from 'complaint/complaint.service';
import { RequestServicesService } from 'requestServices/requestServices.service';
import { VouchersService } from 'vochers/vouchers.service';
import axios from 'axios';
import SmsMessage from 'requestServices/messages/smsMessages';
import { resolveSrv } from 'dns/promises';

@Injectable()
export class CronsService {
  constructor(
    private readonly tasksService: TasksServices, // Ensure the service name is correct
    private readonly complaintService: ComplaintsService, // Ensure the service name is correct
    private readonly elasticService: ElasticService,
    private readonly requestServicesService: RequestServicesService,
    private readonly vouchersService: VouchersService,
  ) { }


  @Cron(CronExpression.EVERY_2_HOURS)
  async handleCron() {
    const status = "Closed";
    const page = 1;
    const per_page = 10;
    const complaint_tasks = await this.elasticService.searchComplaintTask("tasks", status, page, per_page);
    for (const task of complaint_tasks.results as any[]) {
      if (task.createdAt) {
        const taskDate = moment(task.createdAt);
        const now = moment();
        const hoursDifference = now.diff(taskDate, 'hours');
        let level = null
        if (hoursDifference >= 48 && hoursDifference < 72 && task.type === "First Level") {
          level =  "Escalated (Level 1)"
        }
        if (hoursDifference >= 72 && hoursDifference < 120 && task.type === "Final Level") {
          level =  "Escalated (Level 2)"
        }
        if (hoursDifference >= 120 && task.type === "Escalated 2") {
          level =  "Escalated (Level 3)"
        }
        if(level){
          task.type =  level
          await this.tasksService.update(task.id, task, null)
        }
        // else{
        //   console.log(hoursDifference)
        // }
      } else {
        console.log(`Complaint ID: ${task.id}, createdAt not found`);
      }
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  async handleExtendedVoucher() {
    const page = 1;
    const per_page = 200;
    const complaint_tasks = await this.elasticService.searchExtendedVoucher("services", page, per_page);
    const data = complaint_tasks.results
    for (let i = 0; i < data.length; i++) {
      let updated = false
      for (let j = 0; j < data[i].metadata.voucher.length; j++) {
        for (let z = 0; z < data[i].metadata.voucher[j].vouchers.length; z++) {
          const element = data[i].metadata.voucher[j].vouchers[z];
          if (element.metadata.status === "Extended") {
            const now_date = new Date();
            const extended_expired_date = new Date(element.metadata.extanded_expired_date);
            if (now_date > extended_expired_date) {
              console.log("1")
              data[i].metadata.voucher[j].vouchers[z].metadata.status = "Expired";
              data[i].metadata.voucher[j].vouchers[z].status = "Expired";
              await this.vouchersService.update(element.id, element)
              updated = true
            }
            else {
              const timeDiff = extended_expired_date.getTime() - now_date.getTime(); 
              const daysLeft = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
              console.log(12)
              if (daysLeft === 3) {
                console.log(2)
                const numbers = data[i].metadata.customer.phone_number || data[i].metadata.Company.phone_number;
                const language = data[i]?.metadata?.IsArabic ? "ar" : "en"
                const message = SmsMessage[data.type]["Note Extented"][language]          
                await this.sendSms(numbers, `${message}\nhttps://main.d3n0sp6u84gnwb.amplifyapp.com/#/services/${data.id}/rating`, numbers)
              }
            }
          }
        }        
      }
      if(updated){
        console.log(123)
        await this.requestServicesService.update(data[i].id , data[i])
        await this.elasticService.updateDocument("services", data[i].id, data[i])  
      }

    }
    // for (const task of complaint_tasks.results as any[]) {
    //   if (task.createdAt) {
    //     const taskDate = moment(task.createdAt);
    //     const now = moment();
    //     const hoursDifference = now.diff(taskDate, 'hours');
    //     let level = null
    //     if (hoursDifference >= 48 && hoursDifference < 72 && task.type === "First Level") {
    //       level =  "Escalated (Level 1)"
    //     }
    //     if (hoursDifference >= 72 && hoursDifference < 120 && task.type === "Final Level") {
    //       level =  "Escalated (Level 2)"
    //     }
    //     if (hoursDifference >= 120 && task.type === "Escalated 2") {
    //       level =  "Escalated (Level 3)"
    //     }
    //     if(level){
    //       task.type =  level
    //       await this.tasksService.update(task.id, task, null)
    //     }
    //     // else{
    //     //   console.log(hoursDifference)
    //     // }
    //   } else {
    //     console.log(`Complaint ID: ${task.id}, createdAt not found`);
    //   }
    // }
  }

  // @Cron(CronExpression.EVERY_30_SECONDS)
  // async handleCroTEST() {
  //   const number = "+962776850132";
    
  //   // التحقق من موافقة المستخدم قبل الإرسال
  //   const isApproved = await this.checkUserConsent(number);
  //   if (!isApproved) {
  //     console.log(`لم يتم إرسال الرسالة، لا يوجد موافقة من الرقم ${number}`);
  //     return;
  //   }

  //   const message = "SRV-CityMall: hello"; // إضافة رمز SRV قبل اسم المرسل
  //   await this.sendSmss({}, message, number);
  // }

// async sendSmss(data: any, message: any, number: string) {
//   const senderId = 'City Mall';
//   const numbers = number;
//   const accName = '';
//   const accPass = '';

//   const srvDomain = '_http._tcp.josmsservice.com'; // Adjust if needed

//   try {
//     // Resolve SRV record
//     const srvRecords = await resolveSrv(srvDomain);

//     if (!srvRecords.length) {
//       throw new Error('No SRV records found');
//     }

//     // Pick the highest-priority record
//     const { name: host, port } = srvRecords[0];

//     const smsUrl = `https://${host}:${port}/SMSServices/Clients/Prof/RestSingleSMS_General/SendSMS`;

//     // Send the request
//     const response = await axios.get(smsUrl, {
//       params: {
//         senderid: senderId,
//         numbers: numbers,
//         accname: accName,
//         AccPass: accPass,
//         msg: encodeURIComponent(message),
//       },
//     });

//     return response.data;
//   } catch (error) {
//     console.error('Error sending SMS:', error);
//     throw error;
//   }
// }

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
  async sendSmss(data: any, message: string, number: string) {
    const smsUrl = `https://josmsservice.com/SMSServices/Clients/Prof/RestSingleSMS_General/SendSMS`;

    try {
      const response = await axios.get(smsUrl, {
        params: {
          senderid: 'City Mall',
          numbers: number,
          accname: 'CityMall',
          AccPass: 'G_PAXDujRvrw_KoD',
          msg: encodeURIComponent(message),
        },
      });

      console.log(`SMS sent successfully to ${number}:`, response.data);
    } catch (error) {
      console.error(`Failed to send SMS to ${number}:`, error);
    }
  }

  async checkUserConsent(number: string): Promise<boolean> {
    const approvedNumbers = ["+962776850132"]; 
    return approvedNumbers.includes(number);
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

