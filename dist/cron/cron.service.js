"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CronService = void 0;
const common_1 = require("@nestjs/common");
const requestServices_entity_1 = require("../requestServices/entities/requestServices.entity");
const schedule_1 = require("@nestjs/schedule");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const axios_1 = require("axios");
let CronService = class CronService {
    constructor(requestServicesRepo) {
        this.requestServicesRepo = requestServicesRepo;
    }
    async handleDailyJob() {
        console.log('Running daily check for expiring vouchers at 10:00 AM');
        const currentDate = new Date();
        const oneWeekLater = new Date();
        oneWeekLater.setDate(currentDate.getDate() + 7);
        const expiringServices = await this.requestServicesRepo.find({
            where: {
                name: 'Gift Voucher Sales',
                state: 'Sold',
                metadata: (0, typeorm_2.Raw)((alias) => `metadata->>'Expiry_date' IS NOT NULL AND metadata->>'Expiry_date' <> '' AND (metadata->>'Expiry_date')::timestamp >= :currentDate AND (metadata->>'Expiry_date')::timestamp <= :oneWeekLater`, {
                    currentDate: currentDate.toISOString(),
                    oneWeekLater: oneWeekLater.toISOString(),
                }),
            },
        });
        expiringServices.forEach(async (service) => {
            const senderId = 'City Mall';
            console.log(service);
            const numbers = service?.metadata?.customer?.phone_number || service?.metadata?.Company?.constact?.phone_number;
            const accName = 'CityMall';
            console.log(numbers);
            const accPass = 'G_PAXDujRvrw_KoD';
            const msg = "Your Voucher will done after 1 Week ";
            const smsUrl = `https://josmsservice.com/SMSServices/Clients/Prof/RestSingleSMS_General/SendSMS`;
            const response = await axios_1.default.get(smsUrl, {
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
};
exports.CronService = CronService;
__decorate([
    (0, schedule_1.Cron)('* 13 * * *', { timeZone: 'Asia/Amman' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CronService.prototype, "handleDailyJob", null);
exports.CronService = CronService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(requestServices_entity_1.RequestServices)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], CronService);
//# sourceMappingURL=cron.service.js.map