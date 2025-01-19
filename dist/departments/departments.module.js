"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DepartmentsModule = void 0;
const common_1 = require("@nestjs/common");
const departments_controller_1 = require("./departments.controller");
const departments_service_1 = require("./departments.service");
const departments_provider_1 = require("./departments.provider");
const database_module_1 = require("../database/database.module");
const roles_module_1 = require("../roles/roles.module");
const elasticsearch_module_1 = require("../ElasticSearch/elasticsearch.module");
let DepartmentsModule = class DepartmentsModule {
};
exports.DepartmentsModule = DepartmentsModule;
exports.DepartmentsModule = DepartmentsModule = __decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule, roles_module_1.RolesModule, elasticsearch_module_1.ElasticSearchModule],
        controllers: [departments_controller_1.DepartmentsController],
        providers: [departments_service_1.DepartmentsService, ...departments_provider_1.DepartmentProvider]
    })
], DepartmentsModule);
//# sourceMappingURL=departments.module.js.map