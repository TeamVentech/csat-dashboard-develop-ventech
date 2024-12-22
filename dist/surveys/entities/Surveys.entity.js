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
exports.Surveys = void 0;
const qrCodes_entity_1 = require("../../qrcode/entities/qrCodes.entity");
const typeorm_1 = require("typeorm");
const uuid_1 = require("uuid");
let Surveys = class Surveys {
    constructor() {
        this.id = (0, uuid_1.v4)();
    }
};
exports.Surveys = Surveys;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Surveys.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Surveys.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Surveys.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Surveys.prototype, "state", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Surveys.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Surveys.prototype, "brief", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Date)
], Surveys.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Surveys.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => qrCodes_entity_1.QRCodes, qrCodes => qrCodes.survey),
    __metadata("design:type", Array)
], Surveys.prototype, "survey", void 0);
exports.Surveys = Surveys = __decorate([
    (0, typeorm_1.Entity)('surveys')
], Surveys);
//# sourceMappingURL=Surveys.entity.js.map