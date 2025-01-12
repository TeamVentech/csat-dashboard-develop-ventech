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
exports.SurveysService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
let SurveysService = class SurveysService {
    constructor(SurveysRepository) {
        this.SurveysRepository = SurveysRepository;
    }
    async create(createSurveysDto) {
        const Surveys = this.SurveysRepository.create(createSurveysDto);
        return this.SurveysRepository.save(Surveys);
    }
    async findAll(page, perPage, filterOptions) {
        page = page || 1;
        perPage = perPage || 10;
        const queryBuilder = this.SurveysRepository.createQueryBuilder('user');
        if (filterOptions) {
            if (filterOptions.search) {
                const searchString = await filterOptions.search.startsWith(' ')
                    ? filterOptions.search.replace(' ', '+')
                    : filterOptions.search;
                filterOptions.search = searchString;
                queryBuilder.andWhere('(user.name ILIKE :search)', {
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
        const Surveys = await this.SurveysRepository.findOne({ where: { id: id } });
        if (!Surveys) {
            throw new common_1.NotFoundException(`Surveys with ID ${id} not found`);
        }
        return Surveys;
    }
    async reportData(id, from, to, filter) {
        const queryBuilder = this.SurveysRepository.createQueryBuilder('survey');
        queryBuilder.where('survey.id = :id', { id });
        if (from && to) {
            queryBuilder.andWhere('survey.createdAt BETWEEN :from AND :to', { from, to });
        }
        else if (from) {
            queryBuilder.andWhere('survey.createdAt >= :from', { from });
        }
        else if (to) {
            queryBuilder.andWhere('survey.createdAt <= :to', { to });
        }
        switch (filter) {
            case 'daily':
                queryBuilder
                    .select("DATE(survey.createdAt) as date")
                    .addSelect("COUNT(*) as value")
                    .groupBy("DATE(survey.createdAt)")
                    .orderBy("DATE(survey.createdAt)", "ASC");
                break;
            case 'weekly':
                queryBuilder
                    .select("TO_CHAR(DATE_TRUNC('week', survey.createdAt), 'YYYY-MM-DD') as date")
                    .addSelect("COUNT(*) as value")
                    .groupBy("DATE_TRUNC('week', survey.createdAt)")
                    .orderBy("DATE_TRUNC('week', survey.createdAt)", "ASC");
                break;
            case 'monthly':
                queryBuilder
                    .select("TO_CHAR(DATE_TRUNC('month', survey.createdAt), 'YYYY-MM-DD') as date")
                    .addSelect("COUNT(*) as value")
                    .groupBy("DATE_TRUNC('month', survey.createdAt)")
                    .orderBy("DATE_TRUNC('month', survey.createdAt)", "ASC");
                break;
            default:
                throw new Error('Invalid filter type. Use daily, weekly, or monthly.');
        }
        const data = await queryBuilder.getRawMany();
        if (!data.length) {
            throw new common_1.NotFoundException(`No survey data found for ID ${id} within the specified date range.`);
        }
        return data.map(row => ({ date: row.date, value: Number(row.value) }));
    }
    async update(id, updateSurveysDto) {
        const survey = await this.findOne(id);
        console.log(updateSurveysDto);
        if (updateSurveysDto.metadata) {
            survey.metadata.questions = updateSurveysDto.metadata.questions;
        }
        survey.name = updateSurveysDto?.name;
        survey.brief = updateSurveysDto?.brief;
        survey.state = updateSurveysDto?.state;
        await this.SurveysRepository.update(id, survey);
        return this.findOne(id);
    }
    async remove(id) {
        const Surveys = await this.findOne(id);
        await this.SurveysRepository.remove(Surveys);
    }
};
exports.SurveysService = SurveysService;
exports.SurveysService = SurveysService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('SURVEYS_REPOSITORY')),
    __metadata("design:paramtypes", [typeorm_1.Repository])
], SurveysService);
//# sourceMappingURL=surveys.service.js.map