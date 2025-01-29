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
exports.Services = void 0;
const typeorm_1 = require("typeorm");
const uuid_1 = require("uuid");
let Services = class Services {
    constructor() {
        this.id = (0, uuid_1.v4)();
    }
    generateCustomId() {
        const prefix = 'AS';
        const year = new Date().getFullYear().toString();
        const month = new Date().getMonth().toString();
        const day = new Date().getDay().toString();
        const time = new Date().getTime().toString();
        this.serviceId = `#${prefix}-${year}${month}${day}-${time}`;
    }
};
exports.Services = Services;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Services.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Services.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Services.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Services.prototype, "addedBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Services.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Services.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'service_id', unique: true }),
    __metadata("design:type", String)
], Services.prototype, "serviceId", void 0);
__decorate([
    (0, typeorm_1.BeforeInsert)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], Services.prototype, "generateCustomId", null);
exports.Services = Services = __decorate([
    (0, typeorm_1.Entity)('services')
], Services);
//# sourceMappingURL=services.entity.js.map