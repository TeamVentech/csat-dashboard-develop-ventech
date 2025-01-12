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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionSurvey = void 0;
const typeorm_1 = require("typeorm");
const customers_entity_1 = require("../../customers/entities/customers.entity");
const Surveys_entity_1 = require("../../surveys/entities/Surveys.entity");
const categories_entity_1 = require("../../categories/entities/categories.entity");
let TransactionSurvey = class TransactionSurvey {
};
exports.TransactionSurvey = TransactionSurvey;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TransactionSurvey.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], TransactionSurvey.prototype, "state", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'Customer' }),
    __metadata("design:type", String)
], TransactionSurvey.prototype, "addedBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], TransactionSurvey.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], TransactionSurvey.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Array)
], TransactionSurvey.prototype, "answers", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "5" }),
    __metadata("design:type", String)
], TransactionSurvey.prototype, "rating", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: 'customer_id', type: 'uuid' }),
    __metadata("design:type", String)
], TransactionSurvey.prototype, "customerId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => customers_entity_1.Customer, { eager: true }),
    (0, typeorm_1.JoinColumn)({ name: 'customer_id' }),
    __metadata("design:type", customers_entity_1.Customer)
], TransactionSurvey.prototype, "customer", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: 'survey_id', type: 'uuid' }),
    __metadata("design:type", String)
], TransactionSurvey.prototype, "surveyId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Surveys_entity_1.Surveys, { eager: true }),
    (0, typeorm_1.JoinColumn)({ name: 'survey_id' }),
    __metadata("design:type", Surveys_entity_1.Surveys)
], TransactionSurvey.prototype, "survey", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: 'touchpoint_id', type: 'uuid' }),
    __metadata("design:type", String)
], TransactionSurvey.prototype, "touchpointId", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: 'category_id', type: 'uuid' }),
    __metadata("design:type", String)
], TransactionSurvey.prototype, "categoryId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => categories_entity_1.Category, { eager: true }),
    (0, typeorm_1.JoinColumn)({ name: 'category_id' }),
    __metadata("design:type", categories_entity_1.Category)
], TransactionSurvey.prototype, "category", void 0);
exports.TransactionSurvey = TransactionSurvey = __decorate([
    (0, typeorm_1.Entity)('transaction_survey'),
    (0, typeorm_1.Index)('idx_category_touchpoint', ['categoryId', 'touchpointId']),
    (0, typeorm_1.Index)('idx_customer_gender_age', ['customerId']),
    (0, typeorm_1.Index)('idx_created_at', ['createdAt']),
    (0, typeorm_1.Index)('idx_survey_touchpoint', ['surveyId', 'touchpointId'])
], TransactionSurvey);
//# sourceMappingURL=transactionSurvey.entity.js.map