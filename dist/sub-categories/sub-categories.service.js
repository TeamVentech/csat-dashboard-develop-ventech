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
exports.SubCategoriesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
let SubCategoriesService = class SubCategoriesService {
    constructor(subCategoryRepository, categoryRepository) {
        this.subCategoryRepository = subCategoryRepository;
        this.categoryRepository = categoryRepository;
    }
    async create(createSubCategoryDto) {
        const category = await this.categoryRepository.findOne({ where: { id: createSubCategoryDto.categoryId } });
        if (!category) {
            throw new common_1.NotFoundException(`Category with ID ${createSubCategoryDto.categoryId} not found`);
        }
        const subCategory = this.subCategoryRepository.create({
            ...createSubCategoryDto,
            category,
        });
        return this.subCategoryRepository.save(subCategory);
    }
    async findAll(page, perPage, filterOptions) {
        page = page || 1;
        perPage = perPage || 10;
        const queryBuilder = this.subCategoryRepository.createQueryBuilder('subCategories')
            .leftJoinAndSelect('subCategories.category', 'category')
            .leftJoinAndSelect('subCategories.location', 'location');
        if (filterOptions) {
            if (filterOptions.search) {
                const searchString = filterOptions.search.trim().startsWith(' ')
                    ? filterOptions.search.replace(' ', '+')
                    : filterOptions.search;
                filterOptions.search = searchString;
                queryBuilder.andWhere('(subCategories.name ILIKE :search)', {
                    search: `%${filterOptions.search}%`,
                });
            }
            Object.keys(filterOptions).forEach(key => {
                if (key !== 'search' && filterOptions[key]) {
                    queryBuilder.andWhere(`subCategories.${key} = :${key}`, { [key]: filterOptions[key] });
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
        return this.subCategoryRepository.findOne({
            where: { id },
            relations: ['category', 'location'],
        });
    }
    async getAll() {
        return this.subCategoryRepository.find({
            relations: ['category', 'location'],
        });
    }
    async update(id, updateSubCategoryDto) {
        await this.findOne(id);
        await this.subCategoryRepository.update(id, updateSubCategoryDto);
        return this.findOne(id);
    }
    async remove(id) {
        const subCategory = await this.findOne(id);
        await this.subCategoryRepository.remove(subCategory);
    }
};
exports.SubCategoriesService = SubCategoriesService;
exports.SubCategoriesService = SubCategoriesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('SUBCATEGORY_REPOSITORY')),
    __param(1, (0, common_1.Inject)('CATEGORY_REPOSITORY')),
    __metadata("design:paramtypes", [typeorm_1.Repository,
        typeorm_1.Repository])
], SubCategoriesService);
//# sourceMappingURL=sub-categories.service.js.map