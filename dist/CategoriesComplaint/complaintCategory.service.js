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
exports.ComplaintCategoryService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const complaintCategory_entity_1 = require("./entities/complaintCategory.entity");
const class_transformer_1 = require("class-transformer");
let ComplaintCategoryService = class ComplaintCategoryService {
    constructor(categoryRepository) {
        this.categoryRepository = categoryRepository;
    }
    async create(createComplaintCategoryDto) {
        const category = (0, class_transformer_1.plainToInstance)(complaintCategory_entity_1.ComplaintCategory, createComplaintCategoryDto);
        return this.categoryRepository.save(category);
    }
    async findAll(page, perPage, filterOptions) {
        page = page || 1;
        perPage = perPage || 10;
        const queryBuilder = this.categoryRepository.createQueryBuilder('user');
        if (filterOptions) {
            if (filterOptions.search) {
                const searchString = await filterOptions.search.startsWith(' ')
                    ? filterOptions.search.replace(' ', '+')
                    : filterOptions.search;
                filterOptions.search = searchString;
                queryBuilder.andWhere('(user.name ILIKE :search OR user.description ILIKE :search)', {
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
        const category = await this.categoryRepository.findOne({ where: { id: id } });
        if (!category) {
            throw new common_1.NotFoundException(`ComplaintCategory with ID ${id} not found`);
        }
        return category;
    }
    async findAllComplaintCategory() {
        return this.categoryRepository.find();
    }
    async update(id, updateComplaintCategoryDto) {
        await this.findOne(id);
        await this.categoryRepository.update(id, updateComplaintCategoryDto);
        return this.findOne(id);
    }
    async remove(id) {
        const category = await this.findOne(id);
        await this.categoryRepository.remove(category);
    }
};
exports.ComplaintCategoryService = ComplaintCategoryService;
exports.ComplaintCategoryService = ComplaintCategoryService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('COMPLAINT_CATEGORY_REPOSITORY')),
    __metadata("design:paramtypes", [typeorm_1.Repository])
], ComplaintCategoryService);
//# sourceMappingURL=complaintCategory.service.js.map