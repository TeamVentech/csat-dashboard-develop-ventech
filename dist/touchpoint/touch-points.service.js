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
exports.TouchPointsService = void 0;
const common_1 = require("@nestjs/common");
const common_2 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
let TouchPointsService = class TouchPointsService {
    constructor(touchPointRepository, categoryRepository) {
        this.touchPointRepository = touchPointRepository;
        this.categoryRepository = categoryRepository;
    }
    async create(createTouchPointDto) {
        const category = await this.categoryRepository.findOne({ where: { id: createTouchPointDto.categoryId } });
        if (!category) {
            throw new common_1.NotFoundException(`Category with ID ${createTouchPointDto.categoryId} not found`);
        }
        const subCategory = this.touchPointRepository.create({
            ...createTouchPointDto,
            category,
        });
        return this.touchPointRepository.save(subCategory);
    }
    async findAll(page, perPage, filterOptions) {
        page = page || 1;
        perPage = perPage || 10;
        const queryBuilder = this.touchPointRepository.createQueryBuilder('touchpoint')
            .leftJoinAndSelect('touchpoint.category', 'category')
            .leftJoinAndSelect('touchpoint.location', 'location');
        if (filterOptions) {
            if (filterOptions.search) {
                const searchString = filterOptions.search.trim().startsWith(' ')
                    ? filterOptions.search.replace(' ', '+')
                    : filterOptions.search;
                filterOptions.search = searchString;
                queryBuilder.andWhere('(touchpoint.name ILIKE :search)', {
                    search: `%${filterOptions.search}%`,
                });
            }
            Object.keys(filterOptions).forEach(key => {
                if (key !== 'search' && filterOptions[key]) {
                    queryBuilder.andWhere(`touchpoint.${key} = :${key}`, { [key]: filterOptions[key] });
                }
            });
        }
        const [categories, total] = await queryBuilder
            .skip((page - 1) * perPage)
            .take(perPage)
            .getManyAndCount();
        return { categories, total };
    }
    async findAllSearch(page, perPage, filterOptions, categoryType) {
        page = page || 1;
        perPage = perPage || 10;
        const queryBuilder = this.touchPointRepository
            .createQueryBuilder('touchpoint')
            .leftJoinAndSelect('touchpoint.category', 'category')
            .where('category.type = :categoryType', { categoryType });
        if (filterOptions) {
            if (filterOptions.search) {
                const searchString = filterOptions.search.trim().startsWith(' ')
                    ? filterOptions.search.replace(' ', '+')
                    : filterOptions.search;
                filterOptions.search = searchString;
                queryBuilder.andWhere('(touchpoint.name ILIKE :search)', {
                    search: `%${filterOptions.search}%`,
                });
            }
            Object.keys(filterOptions).forEach(key => {
                if (key !== 'search' && filterOptions[key]) {
                    queryBuilder.andWhere(`touchpoint.${key} = :${key}`, { [key]: filterOptions[key] });
                }
            });
        }
        queryBuilder.orderBy('touchpoint.createdAt', 'DESC');
        const [categories, total] = await queryBuilder
            .skip((page - 1) * perPage)
            .take(perPage)
            .getManyAndCount();
        return { categories, total };
    }
    async findOne(id) {
        return this.touchPointRepository.findOne({
            where: { id },
            relations: ['category'],
        });
    }
    async findByCategory(id) {
        return this.touchPointRepository.find({
            where: { categoryId: id },
            relations: ['category'],
        });
    }
    async getAll() {
        return this.touchPointRepository.find({
            relations: ['category'],
        });
    }
    async findAllCategory() {
        return this.touchPointRepository.find();
    }
    async update(id, rating) {
        const touchPoint = await this.touchPointRepository.findOne({ where: { id } });
        touchPoint.rating = rating;
        touchPoint.countTransaction++;
        const categories = await this.categoryRepository.findOne({ where: { id: touchPoint.categoryId } });
        categories.rating = rating;
        categories.counted = (Number(categories.counted) + 1).toString();
        await this.categoryRepository.save(categories);
        await this.touchPointRepository.save(touchPoint);
    }
    async updaterochpoint(id, updateTouchPointDto) {
        await this.findOne(id);
        await this.touchPointRepository.update(id, updateTouchPointDto);
        return this.findOne(id);
    }
    async remove(id) {
        const touchPoint = await this.findOne(id);
        await this.touchPointRepository.remove(touchPoint);
    }
    async findHighestRated() {
        const highestRatedTouchPoint = await this.touchPointRepository
            .createQueryBuilder('touchpoint')
            .leftJoinAndSelect('touchpoint.category', 'category')
            .orderBy('touchpoint.rating', 'DESC')
            .addOrderBy('touchpoint.countTransaction', 'DESC')
            .getOne();
        if (!highestRatedTouchPoint) {
            throw new common_1.NotFoundException('No touchpoints found');
        }
        return highestRatedTouchPoint;
    }
    async findLowestRated() {
        const lowestRatedTouchPoint = await this.touchPointRepository
            .createQueryBuilder('touchpoint')
            .leftJoinAndSelect('touchpoint.category', 'category')
            .orderBy('touchpoint.rating', 'ASC')
            .addOrderBy('touchpoint.countTransaction', 'ASC')
            .getOne();
        if (!lowestRatedTouchPoint) {
            throw new common_1.NotFoundException('No touchpoints found');
        }
        return lowestRatedTouchPoint;
    }
};
exports.TouchPointsService = TouchPointsService;
exports.TouchPointsService = TouchPointsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_2.Inject)('TOUCHPOINT_REPOSITORY')),
    __param(1, (0, common_2.Inject)('CATEGORY_REPOSITORY')),
    __metadata("design:paramtypes", [typeorm_1.Repository,
        typeorm_1.Repository])
], TouchPointsService);
//# sourceMappingURL=touch-points.service.js.map