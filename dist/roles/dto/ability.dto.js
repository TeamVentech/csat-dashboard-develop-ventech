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
exports.AbilityDto = void 0;
const class_validator_1 = require("class-validator");
const ability_actions_enum_1 = require("../../enums/ability-actions.enum");
const ability_subjects_enum_1 = require("../../enums/ability-subjects.enum");
class AbilityDto {
}
exports.AbilityDto = AbilityDto;
__decorate([
    (0, class_validator_1.IsEnum)(ability_actions_enum_1.AbilityActions),
    __metadata("design:type", String)
], AbilityDto.prototype, "action", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(ability_subjects_enum_1.AbilitySubjects),
    __metadata("design:type", String)
], AbilityDto.prototype, "subject", void 0);
//# sourceMappingURL=ability.dto.js.map