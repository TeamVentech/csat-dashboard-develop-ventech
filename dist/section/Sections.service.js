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
exports.SectionsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
let SectionsService = class SectionsService {
    constructor(sectionRepository) {
        this.sectionRepository = sectionRepository;
    }
    async create(createSectionDto) {
        const Section = this.sectionRepository.create(createSectionDto);
        return this.sectionRepository.save(Section);
    }
    async findAll(page, perPage, filterOptions) {
        page = page || 1;
        perPage = perPage || 10;
        const queryBuilder = this.sectionRepository.createQueryBuilder('user');
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
        const Section = await this.sectionRepository.findOne({ where: { id: id } });
        if (!Section) {
            throw new common_1.NotFoundException(`Section with ID ${id} not found`);
        }
        return Section;
    }
    async findallwithoutfilter() {
        const Section = await this.sectionRepository.find();
        if (!Section) {
            throw new common_1.NotFoundException(`Section with not found`);
        }
        return Section;
    }
    async update(id, updateSectionDto) {
        await this.findOne(id);
        await this.sectionRepository.update(id, updateSectionDto);
        return this.findOne(id);
    }
    async remove(id) {
        const Section = await this.findOne(id);
        await this.sectionRepository.remove(Section);
    }
};
exports.SectionsService = SectionsService;
exports.SectionsService = SectionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('SECTIONS_REPOSITORY')),
    __metadata("design:paramtypes", [typeorm_1.Repository])
], SectionsService);
//# sourceMappingURL=Sections.service.js.map