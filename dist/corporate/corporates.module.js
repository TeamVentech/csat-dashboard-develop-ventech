"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CorporatesModule = void 0;
const common_1 = require("@nestjs/common");
const corporates_controller_1 = require("./corporates.controller");
const corporates_service_1 = require("./corporates.service");
const corporates_provider_1 = require("./corporates.provider");
const database_module_1 = require("../database/database.module");
const roles_module_1 = require("../roles/roles.module");
let CorporatesModule = class CorporatesModule {
};
exports.CorporatesModule = CorporatesModule;
exports.CorporatesModule = CorporatesModule = __decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule, roles_module_1.RolesModule],
        controllers: [corporates_controller_1.CorporatesController],
        providers: [corporates_service_1.CorporatesService, ...corporates_provider_1.CorporatesProvider]
    })
], CorporatesModule);
//# sourceMappingURL=corporates.module.js.map