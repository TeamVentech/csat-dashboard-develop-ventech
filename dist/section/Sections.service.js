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
    constructor(sectionRepository, roleRepository) {
        this.sectionRepository = sectionRepository;
        this.roleRepository = roleRepository;
    }
    async create(createSectionDto) {
        const { name, role, departmentId } = createSectionDto;
        const sectionRoles = await this.roleRepository.findBy({
            name: (0, typeorm_1.In)(role),
        });
        const section = this.sectionRepository.create({
            name,
            role: role,
            departmentId,
        });
        return this.sectionRepository.save(section);
    }
    async findAllSections() {
        return this.sectionRepository.find();
    }
    async findAll(page, perPage, filterOptions) {
        page = page || 1;
        perPage = perPage || 10;
        const queryBuilder = this.sectionRepository.createQueryBuilder('section')
            .leftJoinAndSelect('section.department', 'department');
        if (filterOptions) {
            if (filterOptions.search) {
                const searchString = filterOptions.search.startsWith(' ')
                    ? filterOptions.search.replace(' ', '+')
                    : filterOptions.search;
                filterOptions.search = searchString;
                queryBuilder.andWhere('(section.name ILIKE :search)', {
                    search: `%${filterOptions.search}%`,
                });
            }
            Object.keys(filterOptions).forEach(key => {
                if (key !== 'search' && filterOptions[key]) {
                    queryBuilder.andWhere(`section.${key} = :${key}`, { [key]: filterOptions[key] });
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
        const section = await this.sectionRepository.findOne({
            where: { id: id }
        });
        return section;
    }
    async findallwithoutfilter() {
        const Section = await this.sectionRepository.find();
        if (!Section) {
            throw new common_1.NotFoundException(`Section with not found`);
        }
        return Section;
    }
    async update(id, updateSectionDto) {
        const { name, role, departmentId } = updateSectionDto;
        const section = await this.sectionRepository.findOne({
            where: { id },
        });
        if (!section) {
            throw new common_1.NotFoundException(`Section with ID ${id} not found`);
        }
        if (name) {
            section.name = name;
        }
        if (departmentId) {
            section.departmentId = departmentId;
        }
        if (role) {
            section.role = role;
        }
        return this.sectionRepository.save(section);
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
    __param(1, (0, common_1.Inject)('ROLE_REPOSITORY')),
    __metadata("design:paramtypes", [typeorm_1.Repository,
        typeorm_1.Repository])
], SectionsService);
//# sourceMappingURL=Sections.service.js.map