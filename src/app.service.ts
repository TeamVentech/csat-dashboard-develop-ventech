import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class AppService {
  async getHello() {
    const senderId = 'City Mall';
    const numbers = "+962776850132"
    const accName = 'CityMall';
    const accPass = 'G_PAXDujRvrw_KoD';

    const smsUrl = `https://josmsservice.com/SMSServices/Clients/Prof/RestSingleSMS_General/SendSMS`;
    const response = await axios.get(smsUrl, {
      params: {
        senderid: senderId,
        numbers: numbers,
        accname: accName,
        AccPass: accPass,
        msg: encodeURIComponent(`زبوننا العزيز، \n تم تسجيل حالة فقدان الطفل. فرقنا تقوم بعملية البحث. سنبلغكم بأي جديد.\nنتمنى لكم السلامة`),
      },
    });

  }
}
