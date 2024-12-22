"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TouchPointsModule = void 0;
const common_1 = require("@nestjs/common");
const touch_points_controller_1 = require("./touch-points.controller");
const touch_points_service_1 = require("./touch-points.service");
const touchPoint_provider_1 = require("./touchPoint.provider");
const database_module_1 = require("../database/database.module");
const categories_module_1 = require("../categories/categories.module");
const roles_module_1 = require("../roles/roles.module");
let TouchPointsModule = class TouchPointsModule {
};
exports.TouchPointsModule = TouchPointsModule;
exports.TouchPointsModule = TouchPointsModule = __decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule, categories_module_1.CategoriesModule, roles_module_1.RolesModule],
        controllers: [touch_points_controller_1.TouchPointsController],
        providers: [touch_points_service_1.TouchPointsService, ...touchPoint_provider_1.TouchPointProvider],
        exports: [touch_points_service_1.TouchPointsService],
    })
], TouchPointsModule);
//# sourceMappingURL=touch-points.module.js.map