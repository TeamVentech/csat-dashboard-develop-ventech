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
exports.Comment = void 0;
const categories_entity_1 = require("../../categories/entities/categories.entity");
const customers_entity_1 = require("../../customers/entities/customers.entity");
const Surveys_entity_1 = require("../../surveys/entities/Surveys.entity");
const typeorm_1 = require("typeorm");
const uuid_1 = require("uuid");
let Comment = class Comment {
    constructor() {
        this.id = (0, uuid_1.v4)();
    }
};
exports.Comment = Comment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Comment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Comment.prototype, "message", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "comment" }),
    __metadata("design:type", String)
], Comment.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {}, nullable: true }),
    __metadata("design:type", Object)
], Comment.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'customer_id', type: 'uuid' }),
    __metadata("design:type", String)
], Comment.prototype, "customerId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => customers_entity_1.Customer, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'customer_id' }),
    __metadata("design:type", customers_entity_1.Customer)
], Comment.prototype, "customer", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'category_id', type: 'uuid' }),
    __metadata("design:type", String)
], Comment.prototype, "categoryId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => categories_entity_1.Category, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'category_id' }),
    __metadata("design:type", categories_entity_1.Category)
], Comment.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'touchpoint_id', type: 'uuid' }),
    __metadata("design:type", String)
], Comment.prototype, "touchpointId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'touchpoint_name', type: 'json', nullable: true }),
    __metadata("design:type", Object)
], Comment.prototype, "touchpointName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'survey_id', type: 'uuid' }),
    __metadata("design:type", String)
], Comment.prototype, "surveyId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Surveys_entity_1.Surveys, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'survey_id' }),
    __metadata("design:type", Surveys_entity_1.Surveys)
], Comment.prototype, "survey", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], Comment.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'submission_date' }),
    __metadata("design:type", Date)
], Comment.prototype, "submissionDate", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Comment.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Comment.prototype, "createdAt", void 0);
exports.Comment = Comment = __decorate([
    (0, typeorm_1.Entity)('comments')
], Comment);
//# sourceMappingURL=comment.entity.js.map