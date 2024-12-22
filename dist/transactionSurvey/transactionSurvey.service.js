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
exports.TransactionSurveyService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const touch_points_service_1 = require("../touchpoint/touch-points.service");
let TransactionSurveyService = class TransactionSurveyService {
    constructor(transactionSurveyRepository, touchPointRepository, dataSource, touchPointsService) {
        this.transactionSurveyRepository = transactionSurveyRepository;
        this.touchPointRepository = touchPointRepository;
        this.dataSource = dataSource;
        this.touchPointsService = touchPointsService;
    }
    async create(createTransactionSurveyDto) {
        var count = 0;
        var rateVar = 0;
        for (let i = 0; i < createTransactionSurveyDto.answers.length; i++) {
            if (createTransactionSurveyDto.answers[i].type === "rating") {
                count++;
                const rate = Number(createTransactionSurveyDto.answers[i].answer) / Number(createTransactionSurveyDto.answers[i].choices);
                rateVar = rateVar + rate;
            }
        }
        const final_rate = rateVar / count;
        createTransactionSurveyDto.rating = final_rate.toFixed(1).toString();
        const id = createTransactionSurveyDto.touchPointId;
        await this.touchPointsService.update(id, createTransactionSurveyDto.rating);
        const transactionSurvey = this.transactionSurveyRepository.create(createTransactionSurveyDto);
        const savedSurvey = await this.transactionSurveyRepository.save(transactionSurvey);
        return savedSurvey;
    }
    async findAlls() {
        return this.transactionSurveyRepository.find({
            relations: ['customer', 'survey'],
        });
    }
    async findAll(page, perPage, filterOptions) {
        page = page || 1;
        perPage = perPage || 10;
        const queryBuilder = this.transactionSurveyRepository.createQueryBuilder('transactionSurvey')
            .leftJoinAndSelect('transactionSurvey.customer', 'customer')
            .leftJoinAndSelect('transactionSurvey.survey', 'survey');
        if (filterOptions) {
            if (filterOptions.search) {
                const searchString = filterOptions.search.trim().startsWith(' ')
                    ? filterOptions.search.replace(' ', '+')
                    : filterOptions.search;
                filterOptions.search = searchString;
                queryBuilder.andWhere('(survey.name LIKE :search OR customer.name LIKE :search OR transactionSurvey.state LIKE :search)', {
                    search: `%${filterOptions.search}%`,
                });
            }
            Object.keys(filterOptions).forEach(key => {
                if (key !== 'search' && filterOptions[key]) {
                    queryBuilder.andWhere(`transactionSurvey.${key} = :${key}`, { [key]: filterOptions[key] });
                }
            });
        }
        const [categories, total] = await queryBuilder
            .skip((page - 1) * perPage)
            .take(perPage)
            .getManyAndCount();
        return { categories, total };
    }
    async findAllState(page, perPage, filterOptions, surveyId) {
        page = page || 1;
        perPage = perPage || 10;
        const queryBuilder = this.transactionSurveyRepository.createQueryBuilder('transactionSurvey')
            .leftJoinAndSelect('transactionSurvey.customer', 'customer')
            .leftJoinAndSelect('transactionSurvey.survey', 'survey');
        if (filterOptions) {
            if (filterOptions.search) {
                const searchString = filterOptions.search.trim().startsWith(' ')
                    ? filterOptions.search.replace(' ', '+')
                    : filterOptions.search;
                filterOptions.search = searchString;
                queryBuilder.andWhere('(transactionSurvey.state LIKE :search)', {
                    search: `%${filterOptions.search}%`,
                });
            }
            Object.keys(filterOptions).forEach(key => {
                if (key !== 'search' && filterOptions[key]) {
                    queryBuilder.andWhere(`transactionSurvey.${key} = :${key}`, { [key]: filterOptions[key] });
                }
            });
        }
        console.log(surveyId);
        queryBuilder.andWhere('transactionSurvey.surveyId = :surveyId', { surveyId });
        const [categories, total] = await queryBuilder
            .skip((page - 1) * perPage)
            .take(perPage)
            .getManyAndCount();
        return { categories, total };
    }
    async findOne(id) {
        return this.transactionSurveyRepository.findOne({
            where: { id },
            relations: ['customer', 'survey'],
        });
    }
    async update(id, updateTransactionSurveyDto) {
        await this.findOne(id);
        await this.transactionSurveyRepository.update(id, updateTransactionSurveyDto);
        return this.findOne(id);
    }
    async remove(id) {
        const survey = await this.findOne(id);
        await this.transactionSurveyRepository.remove(survey);
    }
    async reportData(id, from, to, filter, category, touchpoint) {
        const queryBuilder = this.transactionSurveyRepository.createQueryBuilder('survey');
        queryBuilder.where('survey.surveyId = :id', { id });
        if (from && to) {
            queryBuilder.andWhere('survey.createdAt BETWEEN :from AND :to', { from, to });
        }
        else if (from) {
            queryBuilder.andWhere('survey.createdAt >= :from', { from });
        }
        else if (to) {
            queryBuilder.andWhere('survey.createdAt <= :to', { to });
        }
        if (category) {
            queryBuilder.andWhere('survey.categoryId = :category', { category });
        }
        if (touchpoint) {
            queryBuilder.andWhere('survey.touchPointId = :touchpoint', { touchpoint });
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
            return [];
        }
        return data.map(row => ({ date: row.date, value: Number(row.value) }));
    }
    async getAverageTouchpointsForSurvey() {
        const result = await this.dataSource.query(`
      SELECT 
          touchpoint_id, 
          COUNT(*) AS transaction_count
      FROM transaction_survey
      GROUP BY touchpoint_id
      ORDER BY transaction_count DESC
      LIMIT 1;
      `);
        const result_least = await this.dataSource.query(`
      SELECT 
          touchpoint_id, 
          COUNT(*) AS transaction_count
      FROM transaction_survey
      GROUP BY touchpoint_id
      ORDER BY transaction_count ASC
      LIMIT 1;
      `);
        const most_data = await this.touchPointRepository.find({
            where: { id: result[0].touchpoint_id },
        });
        const least_data = await this.touchPointRepository.find({
            where: { id: result_least[0].touchpoint_id },
        });
        return {
            most_touchpoints: {
                touchpoint: most_data,
                ...result[0]
            },
            least_touchpoints: {
                touchpoint: least_data,
                ...result_least[0]
            }
        };
    }
    async getAverageTouchpointsDate(fromDate, toDate) {
        const result = await this.dataSource.query(`
      SELECT 
          touchpoint_id, 
          COUNT(*) AS transaction_count
      FROM transaction_survey
      WHERE created_at BETWEEN $1 AND $2
      GROUP BY touchpoint_id
      ORDER BY transaction_count DESC
      LIMIT 1;
      `, [fromDate, toDate]);
        if (result.length === 0) {
            return { most_touchpoints: null };
        }
        const mostData = await this.touchPointRepository.findOne({
            select: ['id', 'name', 'description'],
            where: { id: result[0].touchpoint_id },
        });
        return {
            most_touchpoints: {
                touchpoint: mostData,
                ...result[0],
            },
        };
    }
    async findOneServey(id) {
        return this.transactionSurveyRepository.find({
            where: { surveyId: id },
            relations: ['customer', 'survey'],
        });
    }
    async getRatingsBySurveyCategoryAndTouchPoint(surveyId, categoryId, touchPointId) {
        const transactions = await this.transactionSurveyRepository.find({
            where: { surveyId, categoryId, touchPointId },
            select: ['answers'],
        });
        const ratings = transactions
            .flatMap((transaction) => transaction.answers || [])
            .filter((answer) => answer.type === 'rating')
            .map(({ question, answer, choices }) => ({
            question,
            rating: choices ? parseFloat(answer) / parseFloat(choices) : null,
        }));
        const groupedRatings = ratings.reduce((acc, { question, rating }) => {
            const questionKey = typeof question === 'object'
                ? JSON.stringify(question)
                : question;
            if (!acc[questionKey]) {
                acc[questionKey] = {
                    question,
                    ratings: [],
                };
            }
            acc[questionKey].ratings.push(rating);
            return acc;
        }, {});
        return Object.values(groupedRatings).map(({ question, ratings }) => ({
            question,
            averageRating: (ratings.reduce((sum, r) => sum + (r || 0), 0) / ratings.length).toFixed(1),
        }));
    }
    async getRatings(filterOptions) {
        const queryBuilder = this.transactionSurveyRepository.createQueryBuilder('transactionSurvey')
            .leftJoinAndSelect('transactionSurvey.customer', 'customer');
        if (filterOptions.categoryId) {
            queryBuilder.andWhere('transactionSurvey.categoryId = :categoryId', {
                categoryId: filterOptions.categoryId,
            });
        }
        if (filterOptions.touchPointId) {
            queryBuilder.andWhere('transactionSurvey.touchPointId = :touchPointId', {
                touchPointId: filterOptions.touchPointId,
            });
        }
        if (filterOptions.customerAge) {
            queryBuilder.andWhere('customer.age = :customerAge', {
                customerAge: filterOptions.customerAge,
            });
        }
        if (filterOptions.customerGender) {
            queryBuilder.andWhere('customer.gender = :customerGender', {
                customerGender: filterOptions.customerGender,
            });
        }
        if (filterOptions.dateRange) {
            queryBuilder.andWhere('transactionSurvey.createdAt BETWEEN :from AND :to', {
                from: filterOptions.dateRange.from,
                to: filterOptions.dateRange.to,
            });
        }
        const results = await queryBuilder.getRawMany();
        const ratings = results.map((item) => parseFloat(item.transactionSurvey_rating));
        const avgRating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length || 0;
        return {
            avgRating, surveyCount: results.length
        };
    }
    async getCustomerSurvey(filterOptions) {
        const queryBuilder = this.transactionSurveyRepository.createQueryBuilder('transactionSurvey')
            .leftJoinAndSelect('transactionSurvey.customer', 'customer');
        if (filterOptions.cutomerId) {
            queryBuilder.andWhere('customer.id = :cutomerId', {
                cutomerId: filterOptions.cutomerId,
            });
        }
        const results = await queryBuilder.getRawMany();
        return {
            results
        };
    }
};
exports.TransactionSurveyService = TransactionSurveyService;
exports.TransactionSurveyService = TransactionSurveyService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('TRANSACTION_SURVEY_REPOSITORY')),
    __param(1, (0, common_1.Inject)('TOUCHPOINT_REPOSITORY')),
    __metadata("design:paramtypes", [typeorm_1.Repository,
        typeorm_1.Repository,
        typeorm_1.DataSource,
        touch_points_service_1.TouchPointsService])
], TransactionSurveyService);
//# sourceMappingURL=transactionSurvey.service.js.map