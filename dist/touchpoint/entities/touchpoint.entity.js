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
exports.TouchPoint = void 0;
const categories_entity_1 = require("../../categories/entities/categories.entity");
const Locations_entity_1 = require("../../locations/entities/Locations.entity");
const typeorm_1 = require("typeorm");
const uuid_1 = require("uuid");
let TouchPoint = class TouchPoint {
    constructor() {
        this.id = (0, uuid_1.v4)();
    }
};
exports.TouchPoint = TouchPoint;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TouchPoint.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], TouchPoint.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "0" }),
    __metadata("design:type", String)
], TouchPoint.prototype, "rating", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], TouchPoint.prototype, "countTransaction", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], TouchPoint.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: 'category_id', type: 'uuid' }),
    __metadata("design:type", String)
], TouchPoint.prototype, "categoryId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => categories_entity_1.Category),
    (0, typeorm_1.JoinColumn)({ name: 'category_id' }),
    __metadata("design:type", categories_entity_1.Category)
], TouchPoint.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: 'location_id', type: 'uuid' }),
    __metadata("design:type", String)
], TouchPoint.prototype, "locationId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Locations_entity_1.Location),
    (0, typeorm_1.JoinColumn)({ name: 'location_id' }),
    __metadata("design:type", Locations_entity_1.Location)
], TouchPoint.prototype, "location", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], TouchPoint.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], TouchPoint.prototype, "updatedAt", void 0);
exports.TouchPoint = TouchPoint = __decorate([
    (0, typeorm_1.Entity)('touchpoints')
], TouchPoint);
//# sourceMappingURL=touchpoint.entity.js.map