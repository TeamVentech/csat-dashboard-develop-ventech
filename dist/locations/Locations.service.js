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
exports.LocationsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
let LocationsService = class LocationsService {
    constructor(LocationRepository) {
        this.LocationRepository = LocationRepository;
    }
    async create(createLocationDto) {
        const location = this.LocationRepository.create(createLocationDto);
        return this.LocationRepository.save(location);
    }
    async findAll(page, perPage, filterOptions) {
        page = page || 1;
        perPage = perPage || 10;
        const queryBuilder = this.LocationRepository.createQueryBuilder('user');
        if (filterOptions) {
            if (filterOptions.search) {
                const searchString = await filterOptions.search.startsWith(' ')
                    ? filterOptions.search.replace(' ', '+')
                    : filterOptions.search;
                filterOptions.search = searchString;
                queryBuilder.andWhere('(user.name LIKE :search)', {
                    search: `%${filterOptions.search}%`,
                });
            }
            Object.keys(filterOptions).forEach(key => {
                if (key !== 'search' && filterOptions[key]) {
                    queryBuilder.andWhere(`user.${key} = :${key}`, { [key]: filterOptions[key] });
                }
            });
        }
        const [categories, total] = await queryBuilder
            .skip((page - 1) * perPage)
            .take(perPage)
            .getManyAndCount();
        return { categories, total };
    }
    async findOne(id) {
        const location = await this.LocationRepository.findOne({ where: { id: id } });
        if (!location) {
            throw new common_1.NotFoundException(`Location with ID ${id} not found`);
        }
        return location;
    }
    async update(id, updateLocationDto) {
        await this.findOne(id);
        await this.LocationRepository.update(id, updateLocationDto);
        return this.findOne(id);
    }
    async findAllLocation() {
        return this.LocationRepository.find();
    }
    async remove(id) {
        const location = await this.findOne(id);
        await this.LocationRepository.remove(location);
    }
};
exports.LocationsService = LocationsService;
exports.LocationsService = LocationsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('LOCATIONS_REPOSITORY')),
    __metadata("design:paramtypes", [typeorm_1.Repository])
], LocationsService);
//# sourceMappingURL=Locations.service.js.map