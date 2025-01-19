"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestServicesModule = void 0;
const common_1 = require("@nestjs/common");
const requestServices_controller_1 = require("./requestServices.controller");
const requestServices_service_1 = require("./requestServices.service");
const requestServices_provider_1 = require("./requestServices.provider");
const database_module_1 = require("../database/database.module");
const roles_module_1 = require("../roles/roles.module");
const elasticsearch_module_1 = require("../ElasticSearch/elasticsearch.module");
let RequestServicesModule = class RequestServicesModule {
};
exports.RequestServicesModule = RequestServicesModule;
exports.RequestServicesModule = RequestServicesModule = __decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule, roles_module_1.RolesModule, elasticsearch_module_1.ElasticSearchModule],
        controllers: [requestServices_controller_1.RequestServicesController],
        providers: [requestServices_service_1.RequestServicesService, ...requestServices_provider_1.RequestServicesProvider],
        exports: [requestServices_service_1.RequestServicesService]
    })
], RequestServicesModule);
//# sourceMappingURL=requestServices.module.js.map