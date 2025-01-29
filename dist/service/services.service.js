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
exports.ServicesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
let ServicesService = class ServicesService {
    constructor(servicesRepository) {
        this.servicesRepository = servicesRepository;
    }
    async create(createServicesDto) {
        const department = this.servicesRepository.create(createServicesDto);
        return this.servicesRepository.save(department);
    }
    async findAll(page, perPage, filterOptions) {
        page = page || 1;
        perPage = perPage || 10;
        const queryBuilder = this.servicesRepository.createQueryBuilder('services');
        console.log(filterOptions);
        if (filterOptions) {
            if (filterOptions.search) {
                queryBuilder.andWhere('(services.status LIKE :search)', {
                    search: `%${filterOptions.search}%`,
                });
            }
            Object.keys(filterOptions).forEach(key => {
                if (key !== 'search' && filterOptions[key]) {
                    queryBuilder.andWhere(`services.${key} = :${key}`, { [key]: filterOptions[key] });
                }
            });
        }
        queryBuilder.orderBy('services.updatedAt', 'DESC');
        const [data, total] = await queryBuilder
            .skip((page - 1) * perPage)
            .take(perPage)
            .getManyAndCount();
        return { data, total };
    }
    async getServiceStatusCounts(type) {
        const counts = await this.servicesRepository
            .createQueryBuilder('service')
            .select('service.status, COUNT(service.id)', 'count')
            .where('service.type = :type', { type })
            .groupBy('service.status')
            .getRawMany();
        const result = {
            AVAILABLE: 0,
            UNAVAILABLE: 0,
            OCCUPIED: 0,
        };
        counts.forEach((count) => {
            if (result.hasOwnProperty(count.status)) {
                result[count.status] = parseInt(count.count, 10);
            }
        });
        return result;
    }
    async findOne(id) {
        const Services = await this.servicesRepository.findOne({ where: { id: id } });
        if (!Services) {
            throw new common_1.NotFoundException(`Department with ID ${id} not found`);
        }
        return Services;
    }
    async findOneByTypeStatus(type, status) {
        console.log(type);
        console.log(status);
        const Services = await this.servicesRepository.findOne({ where: { type, status } });
        if (!Services) {
            console.log(`Service with Type ${type} & ${status} not found`);
        }
        return Services;
    }
    async update(id, updateServicesDto) {
        await this.findOne(id);
        await this.servicesRepository.update(id, updateServicesDto);
        return this.findOne(id);
    }
    async remove(id) {
        const Services = await this.findOne(id);
        await this.servicesRepository.remove(Services);
    }
};
exports.ServicesService = ServicesService;
exports.ServicesService = ServicesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('SERVICES_REPOSITORY')),
    __metadata("design:paramtypes", [typeorm_1.Repository])
], ServicesService);
//# sourceMappingURL=services.service.js.map