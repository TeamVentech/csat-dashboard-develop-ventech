"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubCategoriesModule = void 0;
const common_1 = require("@nestjs/common");
const sub_categories_controller_1 = require("./sub-categories.controller");
const sub_categories_service_1 = require("./sub-categories.service");
const subcategory_provider_1 = require("./subcategory.provider");
const database_module_1 = require("../database/database.module");
const categories_module_1 = require("../categories/categories.module");
const roles_module_1 = require("../roles/roles.module");
let SubCategoriesModule = class SubCategoriesModule {
};
exports.SubCategoriesModule = SubCategoriesModule;
exports.SubCategoriesModule = SubCategoriesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            database_module_1.DatabaseModule,
            categories_module_1.CategoriesModule,
            database_module_1.DatabaseModule,
            roles_module_1.RolesModule
        ],
        controllers: [sub_categories_controller_1.SubCategoriesController],
        providers: [sub_categories_service_1.SubCategoriesService, ...subcategory_provider_1.SubCategoryProvider],
    })
], SubCategoriesModule);
//# sourceMappingURL=sub-categories.module.js.map