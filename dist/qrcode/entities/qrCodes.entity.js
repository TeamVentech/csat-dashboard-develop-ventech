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
exports.QRCodes = void 0;
const Surveys_entity_1 = require("../../surveys/entities/Surveys.entity");
const typeorm_1 = require("typeorm");
const uuid_1 = require("uuid");
let QRCodes = class QRCodes {
    constructor() {
        this.id = (0, uuid_1.v4)();
    }
};
exports.QRCodes = QRCodes;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], QRCodes.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], QRCodes.prototype, "qr_code_identifier", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], QRCodes.prototype, "image", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], QRCodes.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], QRCodes.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Surveys_entity_1.Surveys, survey => survey.survey),
    __metadata("design:type", Surveys_entity_1.Surveys)
], QRCodes.prototype, "survey", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], QRCodes.prototype, "surveyId", void 0);
exports.QRCodes = QRCodes = __decorate([
    (0, typeorm_1.Entity)('qrcodes')
], QRCodes);
//# sourceMappingURL=qrCodes.entity.js.map