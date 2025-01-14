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
exports.RequestServicesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const axios_1 = require("axios");
const smsMessages_1 = require("./messages/smsMessages");
const elasticsearch_service_1 = require("../ElasticSearch/elasticsearch.service");
let RequestServicesService = class RequestServicesService {
    constructor(requestServicesRepository, elasticService) {
        this.requestServicesRepository = requestServicesRepository;
        this.elasticService = elasticService;
    }
    async create(createRequestServicesDto) {
        try {
            const numbers = createRequestServicesDto?.metadata?.parents?.phone_number || createRequestServicesDto?.metadata?.customer?.phone_number || createRequestServicesDto?.metadata?.Company?.constact?.phone_number;
            if (createRequestServicesDto.type === 'Found Child') {
                if (createRequestServicesDto.metadata.parents.phone_number) {
                    const numbers = createRequestServicesDto?.metadata?.parents?.phone_number;
                    const message = createRequestServicesDto.metadata.isArabic ? "عزيزي العميل، تم العثور على طفلكم وهو الآن في مكتب خدمة العملاء بالطابق الأرضي في سيتي مول. يُرجى إحضار هوية سارية لاستلام الطفل. لمزيد من المساعدة، يُرجى الاتصال على [رقم خدمة العملاء]." : "Dear Customer, your child has been found and is safe at the Customer Care Desk on the Ground Floor of City Mall. Please bring a valid ID to collect your child.";
                    await this.sendSms(numbers, message, numbers);
                    createRequestServicesDto.state = "Awaiting Collection";
                }
            }
            else if (createRequestServicesDto.name !== 'Gift Voucher Sales') {
                const language = createRequestServicesDto?.metadata?.IsArabic ? "ar" : "en";
                const message = smsMessages_1.default[createRequestServicesDto.type][createRequestServicesDto.state][language];
                await this.sendSms(numbers, message, numbers);
            }
            const Service = this.requestServicesRepository.create(createRequestServicesDto);
            var savedService = await this.requestServicesRepository.save(Service);
            await this.elasticService.indexData('services', Service.id, Service);
        }
        catch (error) {
            console.error('Error sending SMS:', error.message);
        }
        return savedService;
    }
    async findAll(page, perPage, filterOptions) {
        page = page || 1;
        perPage = perPage || 10;
        const queryBuilder = this.requestServicesRepository.createQueryBuilder('user');
        if (filterOptions) {
            if (filterOptions.search) {
                const searchString = filterOptions.search.startsWith(' ')
                    ? filterOptions.search.replace(' ', '+')
                    : filterOptions.search;
                filterOptions.search = searchString;
                queryBuilder.andWhere('(user.type ILIKE :search)', {
                    search: `%${filterOptions.search}%`,
                });
            }
            Object.keys(filterOptions).forEach(key => {
                if (key !== 'search' && filterOptions[key]) {
                    queryBuilder.andWhere(`user.${key} = :${key}`, { [key]: filterOptions[key] });
                }
            });
        }
        queryBuilder.orderBy('user.createdAt', 'DESC');
        const [data, total] = await queryBuilder
            .skip((page - 1) * perPage)
            .take(perPage)
            .getManyAndCount();
        return { data, total };
    }
    async findOne(id) {
        const RequestServices = await this.elasticService.getById('services', id);
        if (!RequestServices) {
            throw new common_1.NotFoundException(`Department with ID ${id} not found`);
        }
        return RequestServices.data;
    }
    async findOneColumn(id) {
        const RequestServices = await this.requestServicesRepository.findOne({ where: { id: id } });
        if (!RequestServices) {
            throw new common_1.NotFoundException(`Department with ID ${id} not found`);
        }
        return RequestServices;
    }
    async findType(type) {
        const RequestServices = await this.requestServicesRepository.find({ where: { type: type } });
        if (!RequestServices) {
            throw new common_1.NotFoundException(`Department with ID ${type} not found`);
        }
        return RequestServices;
    }
    async update(id, updateRequestServicesDto) {
        const data = await this.findOneColumn(id);
        if (data.state !== 'Closed' && updateRequestServicesDto.state === 'Closed') {
            const numbers = data?.metadata?.parents?.phone_number || data?.metadata?.customer?.phone_number || data?.metadata?.Company?.constact?.phone_number;
            const language = updateRequestServicesDto?.metadata?.IsArabic ? "ar" : "en";
            const message = smsMessages_1.default[updateRequestServicesDto.type][updateRequestServicesDto.state][language];
            await this.sendSms(numbers, `${message}https://main.d3n0sp6u84gnwb.amplifyapp.com/#/services/${data.id}/rating`, numbers);
        }
        if (data.state === 'Open' && updateRequestServicesDto.state === 'Child Found' && updateRequestServicesDto.type === 'Lost Child') {
            const numbers = data?.metadata?.parents?.phone_number;
            await this.sendSms(numbers, `Your Child Found Location : Floor : ${updateRequestServicesDto.metadata.location.floor}, Area : ${updateRequestServicesDto.metadata.location.tenant}`, numbers);
        }
        if (data.state === 'Open' && updateRequestServicesDto.state === 'Item Found' && updateRequestServicesDto.type === 'Lost Item') {
            const numbers = data?.metadata?.parents?.phone_number;
            const language = updateRequestServicesDto?.metadata?.IsArabic ? "ar" : "en";
            const message = smsMessages_1.default[updateRequestServicesDto.type][updateRequestServicesDto.state][language];
            await this.sendSms(numbers, `Your Child Found Location : Floor : ${updateRequestServicesDto.metadata.location.floor}, Area : ${updateRequestServicesDto.metadata.location.tenant}`, numbers);
        }
        if (updateRequestServicesDto.name === 'Gift Voucher Sales' && updateRequestServicesDto.state === "Sold" && data.state === "Pending") {
            const numbers = updateRequestServicesDto?.metadata?.customer?.phone_number || updateRequestServicesDto?.metadata?.Company?.constact?.phone_number;
            const message = updateRequestServicesDto.metadata.isArabic ? "عزيزي العميل، تم العثور على طفلكم وهو الآن في مكتب خدمة العملاء بالطابق الأرضي في سيتي مول. يُرجى إحضار هوية سارية لاستلام الطفل. لمزيد من المساعدة، يُرجى الاتصال على [رقم خدمة العمsلاء]." : "Dears Customer, your child has been found and is safe at the Customer Care Desk on the Ground Floor of City Mall. Please bring a valid ID to collect your child.";
            await this.sendSms(numbers, message, numbers);
        }
        await this.requestServicesRepository.update(id, updateRequestServicesDto);
        await this.elasticService.updateDocument('services', id, updateRequestServicesDto);
        return this.findOne(id);
    }
    async rating(id, rate) {
        const data = await this.findOneColumn(id);
        await this.requestServicesRepository.update(id, { ...data, rating: rate.rating });
        return this.findOne(id);
    }
    async remove(id) {
        const RequestServices = await this.findOneColumn(id);
        await this.requestServicesRepository.remove(RequestServices);
    }
    async sendSms(data, message, number) {
        const senderId = 'City Mall';
        const numbers = number;
        const accName = 'CityMall';
        const accPass = 'G_PAXDujRvrw_KoD';
        const msg = message;
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
    }
};
exports.RequestServicesService = RequestServicesService;
exports.RequestServicesService = RequestServicesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('REQUEST_SERVICES_REPOSITORY')),
    __metadata("design:paramtypes", [typeorm_1.Repository,
        elasticsearch_service_1.ElasticService])
], RequestServicesService);
//# sourceMappingURL=requestServices.service.js.map