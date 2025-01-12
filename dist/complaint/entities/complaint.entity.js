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
exports.Complaints = void 0;
const categories_entity_1 = require("../../categories/entities/categories.entity");
const customers_entity_1 = require("../../customers/entities/customers.entity");
const typeorm_1 = require("typeorm");
const uuid_1 = require("uuid");
let Complaints = class Complaints {
    constructor() {
        this.id = (0, uuid_1.v4)();
    }
    generateCustomId() {
        const prefix = 'CO';
        const year = new Date().getFullYear().toString();
        const month = new Date().getMonth().toString();
        const day = new Date().getDay().toString();
        const time = new Date().getTime().toString();
        this.complaintId = `#${prefix}-${year}${month}${day}-${time}`;
    }
};
exports.Complaints = Complaints;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Complaints.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Complaints.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Complaints.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Complaints.prototype, "state", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Complaints.prototype, "addedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'customer_id', type: 'uuid' }),
    __metadata("design:type", String)
], Complaints.prototype, "customerId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => customers_entity_1.Customer, { eager: true }),
    (0, typeorm_1.JoinColumn)({ name: 'customer_id' }),
    __metadata("design:type", customers_entity_1.Customer)
], Complaints.prototype, "customer", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'category_id', type: 'uuid' }),
    __metadata("design:type", String)
], Complaints.prototype, "categoryId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => categories_entity_1.Category, { eager: true }),
    (0, typeorm_1.JoinColumn)({ name: 'category_id' }),
    __metadata("design:type", categories_entity_1.Category)
], Complaints.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Complaints.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'touchpoint_id', type: 'uuid' }),
    __metadata("design:type", String)
], Complaints.prototype, "touchpointId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Complaints.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Complaints.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'service_id', unique: true }),
    __metadata("design:type", String)
], Complaints.prototype, "complaintId", void 0);
__decorate([
    (0, typeorm_1.BeforeInsert)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], Complaints.prototype, "generateCustomId", null);
exports.Complaints = Complaints = __decorate([
    (0, typeorm_1.Entity)('complaint')
], Complaints);
//# sourceMappingURL=complaint.entity.js.map