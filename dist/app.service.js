"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("axios");
let AppService = class AppService {
    async getHello() {
        const senderId = 'City Mall';
        const numbers = "+962776850132";
        const accName = 'CityMall';
        const accPass = 'G_PAXDujRvrw_KoD';
        const smsUrl = `https://josmsservice.com/SMSServices/Clients/Prof/RestSingleSMS_General/SendSMS`;
        const response = await axios_1.default.get(smsUrl, {
            params: {
                senderid: senderId,
                numbers: numbers,
                accname: accName,
                AccPass: accPass,
                msg: encodeURIComponent(`زبوننا العزيز، \n تم تسجيل حالة فقدان الطفل. فرقنا تقوم بعملية البحث. سنبلغكم بأي جديد.\nنتمنى لكم السلامة`),
            },
        });
    }
};
exports.AppService = AppService;
exports.AppService = AppService = __decorate([
    (0, common_1.Injectable)()
], AppService);
//# sourceMappingURL=app.service.js.map