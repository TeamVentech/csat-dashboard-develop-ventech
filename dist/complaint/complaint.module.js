"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplaintsModule = void 0;
const common_1 = require("@nestjs/common");
const complaint_controller_1 = require("./complaint.controller");
const complaint_service_1 = require("./complaint.service");
const complaint_provider_1 = require("./complaint.provider");
const database_module_1 = require("../database/database.module");
const roles_module_1 = require("../roles/roles.module");
let ComplaintsModule = class ComplaintsModule {
};
exports.ComplaintsModule = ComplaintsModule;
exports.ComplaintsModule = ComplaintsModule = __decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule, roles_module_1.RolesModule],
        controllers: [complaint_controller_1.ComplaintsController],
        providers: [complaint_service_1.ComplaintsService, ...complaint_provider_1.ComplaintsProvider],
        exports: [complaint_service_1.ComplaintsService],
    })
], ComplaintsModule);
//# sourceMappingURL=complaint.module.js.map