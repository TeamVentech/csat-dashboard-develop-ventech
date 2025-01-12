"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoriesModule = void 0;
const common_1 = require("@nestjs/common");
const complaintCategory_provider_1 = require("./complaintCategory.provider");
const complaintCategory_service_1 = require("./complaintCategory.service");
const complaintCategory_controller_1 = require("./complaintCategory.controller");
const database_module_1 = require("../database/database.module");
const roles_module_1 = require("../roles/roles.module");
let CategoriesModule = class CategoriesModule {
};
exports.CategoriesModule = CategoriesModule;
exports.CategoriesModule = CategoriesModule = __decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule, roles_module_1.RolesModule],
        controllers: [complaintCategory_controller_1.CategoriesController],
        providers: [complaintCategory_service_1.ComplaintCategoryService, ...complaintCategory_provider_1.complaintCategoryProviders],
        exports: [complaintCategory_service_1.ComplaintCategoryService, ...complaintCategory_provider_1.complaintCategoryProviders],
    })
], CategoriesModule);
//# sourceMappingURL=complaintCategory.module.js.map