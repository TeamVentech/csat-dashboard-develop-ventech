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
exports.Section = void 0;
const departments_entity_1 = require("../../departments/entities/departments.entity");
const typeorm_1 = require("typeorm");
const uuid_1 = require("uuid");
let Section = class Section {
    constructor() {
        this.id = (0, uuid_1.v4)();
    }
};
exports.Section = Section;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Section.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], Section.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)('json', { nullable: true }),
    __metadata("design:type", Array)
], Section.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: 'department_id', type: 'uuid' }),
    __metadata("design:type", String)
], Section.prototype, "departmentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => departments_entity_1.Department, { eager: true }),
    (0, typeorm_1.JoinColumn)({ name: 'department_id' }),
    __metadata("design:type", departments_entity_1.Department)
], Section.prototype, "department", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Section.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Section.prototype, "updatedAt", void 0);
exports.Section = Section = __decorate([
    (0, typeorm_1.Entity)('sections')
], Section);
//# sourceMappingURL=Sections.entity.js.map