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
exports.VouchersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
let VouchersService = class VouchersService {
    constructor(vouchersRepository) {
        this.vouchersRepository = vouchersRepository;
    }
    async create(createVouchersDto) {
        const department = this.vouchersRepository.create(createVouchersDto);
        return this.vouchersRepository.save(department);
    }
    async findAll(page, perPage, filterOptions) {
        page = page || 1;
        perPage = perPage || 10;
        const queryBuilder = this.vouchersRepository.createQueryBuilder('user');
        if (filterOptions) {
            if (filterOptions.search) {
                const searchString = await filterOptions.search.startsWith(' ')
                    ? filterOptions.search.replace(' ', '+')
                    : filterOptions.search;
                filterOptions.search = searchString;
                queryBuilder.andWhere('(user.serialNumber ILIKE :search)', {
                    search: `%${filterOptions.search}%`,
                });
            }
            Object.keys(filterOptions).forEach(key => {
                if (key !== 'search' && filterOptions[key]) {
                    queryBuilder.andWhere(`user.${key} = :${key}`, { [key]: filterOptions[key] });
                }
            });
        }
        const [data, total] = await queryBuilder
            .skip((page - 1) * perPage)
            .take(perPage)
            .getManyAndCount();
        return { data, total };
    }
    async findOne(id) {
        const Vouchers = await this.vouchersRepository.findOne({ where: { id: id } });
        if (!Vouchers) {
            throw new common_1.NotFoundException(`Department with ID ${id} not found`);
        }
        return Vouchers;
    }
    async importVouchers(data) {
        for (const item of data) {
            console.log(item);
            let existingVoucher = await this.vouchersRepository.findOne({
                where: { serialNumber: item.Serial_Number },
            });
            if (existingVoucher) {
                existingVoucher.metadata = item;
                existingVoucher.updatedAt = new Date();
            }
            else {
                existingVoucher = this.vouchersRepository.create({
                    name: "Vouchers",
                    addedBy: "System",
                    metadata: item,
                    serialNumber: item.Serial_Number
                });
            }
            await this.vouchersRepository.save(existingVoucher);
        }
    }
    async GetAvailableVoucher(data) {
        const list = [];
        console.log(data);
        for (const item of data.vouchers) {
            console.log(item);
            const variables = item.denominations;
            const result = await this.vouchersRepository
                .createQueryBuilder('vouchers')
                .where("vouchers.metadata->>'status' != :status", { status: 'Sold' })
                .andWhere("vouchers.metadata->>'Denomination' = :denomination", { denomination: `${variables} JOD` })
                .limit(item.Vouchers)
                .getMany();
            console.log(result);
            list.push({ denominations: variables, vouchers: result, Vouchers: item.Vouchers });
        }
        for (let i = 0; i < list.length; i++) {
            if (list[i].vouchers.length !== list[i].Vouchers) {
                return {
                    message: `You Don't have enough denomination :${list[i].denominations}`,
                    success: false,
                };
            }
        }
        return {
            message: "success",
            success: true,
            data: list
        };
    }
    async update(id, updateVouchersDto) {
        await this.findOne(id);
        await this.vouchersRepository.update(id, updateVouchersDto);
        return this.findOne(id);
    }
    async remove(id) {
        const Vouchers = await this.findOne(id);
        await this.vouchersRepository.remove(Vouchers);
    }
};
exports.VouchersService = VouchersService;
exports.VouchersService = VouchersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('VOUCHERS_REPOSITORY')),
    __metadata("design:paramtypes", [typeorm_1.Repository])
], VouchersService);
//# sourceMappingURL=vouchers.service.js.map