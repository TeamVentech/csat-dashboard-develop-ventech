"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionSurveyModule = void 0;
const common_1 = require("@nestjs/common");
const transactionSurvey_controller_1 = require("./transactionSurvey.controller");
const transactionSurvey_service_1 = require("./transactionSurvey.service");
const transactionSurvey_provider_1 = require("./transactionSurvey.provider");
const database_module_1 = require("../database/database.module");
const touch_points_module_1 = require("../touchpoint/touch-points.module");
const roles_module_1 = require("../roles/roles.module");
let TransactionSurveyModule = class TransactionSurveyModule {
};
exports.TransactionSurveyModule = TransactionSurveyModule;
exports.TransactionSurveyModule = TransactionSurveyModule = __decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule, touch_points_module_1.TouchPointsModule, roles_module_1.RolesModule],
        controllers: [transactionSurvey_controller_1.TransactionSurveyController],
        providers: [transactionSurvey_service_1.TransactionSurveyService, ...transactionSurvey_provider_1.TransactionSurveyProvider],
    })
], TransactionSurveyModule);
//# sourceMappingURL=transactionSurvey.module.js.map