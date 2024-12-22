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
exports.TransactionSurveyController = void 0;
const common_1 = require("@nestjs/common");
const transactionSurvey_service_1 = require("./transactionSurvey.service");
const create_dto_1 = require("./dto/create.dto");
const update_dto_1 = require("./dto/update.dto");
const transform_interceptor_1 = require("../interceptors/transform.interceptor");
const passport_1 = require("@nestjs/passport");
const permissions_guard_1 = require("../guards/permissions.guard");
const permissions_decorator_1 = require("../decorator/permissions.decorator");
let TransactionSurveyController = class TransactionSurveyController {
    constructor(transactionSurveyService) {
        this.transactionSurveyService = transactionSurveyService;
    }
    create(createTransactionSurveyDto) {
        return this.transactionSurveyService.create(createTransactionSurveyDto);
    }
    findAll(page, perPage, search) {
        const filterOptions = {
            search
        };
        return this.transactionSurveyService.findAll(page, perPage, filterOptions);
    }
    findAllState(surveyId, page, perPage, search) {
        const filterOptions = {
            search
        };
        return this.transactionSurveyService.findAllState(page, perPage, filterOptions, surveyId);
    }
    findOne(id) {
        return this.transactionSurveyService.findOne(id);
    }
    findOneServey(id) {
        return this.transactionSurveyService.findOneServey(id);
    }
    update(id, updateTransactionSurveyDto) {
        return this.transactionSurveyService.update(id, updateTransactionSurveyDto);
    }
    remove(id) {
        return this.transactionSurveyService.remove(id);
    }
    report(id, from, to, filter, category, touchpoint) {
        return this.transactionSurveyService.reportData(id, from, to, filter, category, touchpoint);
    }
    reportMostTouchPoint(id, filter) {
    }
    async getAverageTouchpointsForSurvey() {
        return this.transactionSurveyService.getAverageTouchpointsForSurvey();
    }
    async getAverageTouchpointsDate(from, to) {
        return this.transactionSurveyService.getAverageTouchpointsDate(from, to);
    }
    async getRatings(surveyId, categoryId, touchPointId) {
        return this.transactionSurveyService.getRatingsBySurveyCategoryAndTouchPoint(surveyId, categoryId, touchPointId);
    }
    async getRatingsFilter(categoryId, touchPointId, customerAge, customerGender, fromDate, toDate) {
        const filters = {
            categoryId,
            touchPointId,
            customerAge,
            customerGender,
            dateRange: fromDate && toDate ? { from: new Date(fromDate), to: new Date(toDate) } : undefined,
        };
        return this.transactionSurveyService.getRatings(filters);
    }
    async getCustomerSurvey(cutomerId) {
        const filters = {
            cutomerId
        };
        return this.transactionSurveyService.getCustomerSurvey(filters);
    }
};
exports.TransactionSurveyController = TransactionSurveyController;
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('Survey::write'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_dto_1.CreateTransactionSurveyDto]),
    __metadata("design:returntype", void 0)
], TransactionSurveyController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('Survey::read'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('perPage')),
    __param(2, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String]),
    __metadata("design:returntype", void 0)
], TransactionSurveyController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('survey/:surveyId/search/state'),
    __param(0, (0, common_1.Param)('surveyId')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('perPage')),
    __param(3, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number, String]),
    __metadata("design:returntype", void 0)
], TransactionSurveyController.prototype, "findAllState", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.Permissions)('Survey::read'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TransactionSurveyController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)('survey/:id'),
    (0, permissions_decorator_1.Permissions)('Survey::read'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TransactionSurveyController.prototype, "findOneServey", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, permissions_decorator_1.Permissions)('Survey::update'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_dto_1.UpdateTransactionSurveyDto]),
    __metadata("design:returntype", void 0)
], TransactionSurveyController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, permissions_decorator_1.Permissions)('Survey::delete'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TransactionSurveyController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)('survey/:id/report'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('from')),
    __param(2, (0, common_1.Query)('to')),
    __param(3, (0, common_1.Query)('filter')),
    __param(4, (0, common_1.Query)('category')),
    __param(5, (0, common_1.Query)('touchpoint')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], TransactionSurveyController.prototype, "report", null);
__decorate([
    (0, common_1.Get)('survey/:id/report/most-touchpoint'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('filter')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], TransactionSurveyController.prototype, "reportMostTouchPoint", null);
__decorate([
    (0, common_1.Get)('average/report'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TransactionSurveyController.prototype, "getAverageTouchpointsForSurvey", null);
__decorate([
    (0, common_1.Get)('report/date'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TransactionSurveyController.prototype, "getAverageTouchpointsDate", null);
__decorate([
    (0, common_1.Get)('ratings/questions'),
    __param(0, (0, common_1.Query)('surveyId')),
    __param(1, (0, common_1.Query)('categoryId')),
    __param(2, (0, common_1.Query)('touchPointId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], TransactionSurveyController.prototype, "getRatings", null);
__decorate([
    (0, common_1.Get)('ratings/filteration'),
    __param(0, (0, common_1.Query)('categoryId')),
    __param(1, (0, common_1.Query)('touchPointId')),
    __param(2, (0, common_1.Query)('customerAge')),
    __param(3, (0, common_1.Query)('customerGender')),
    __param(4, (0, common_1.Query)('fromDate')),
    __param(5, (0, common_1.Query)('toDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, Date,
        Date]),
    __metadata("design:returntype", Promise)
], TransactionSurveyController.prototype, "getRatingsFilter", null);
__decorate([
    (0, common_1.Get)('customers/surveys'),
    __param(0, (0, common_1.Query)('cutomerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TransactionSurveyController.prototype, "getCustomerSurvey", null);
exports.TransactionSurveyController = TransactionSurveyController = __decorate([
    (0, common_1.Controller)('Transaction_survey'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), permissions_guard_1.PermissionsGuard),
    (0, common_1.UseInterceptors)(common_1.ClassSerializerInterceptor),
    (0, common_1.UseInterceptors)(transform_interceptor_1.TransformInterceptor),
    __metadata("design:paramtypes", [transactionSurvey_service_1.TransactionSurveyService])
], TransactionSurveyController);
//# sourceMappingURL=transactionSurvey.controller.js.map