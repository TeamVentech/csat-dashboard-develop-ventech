"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QrcodeModule = void 0;
const common_1 = require("@nestjs/common");
const qrcode_controller_1 = require("./qrcode.controller");
const qrcode_service_1 = require("./qrcode.service");
const qrcode_provider_1 = require("./qrcode.provider");
const database_module_1 = require("../database/database.module");
let QrcodeModule = class QrcodeModule {
};
exports.QrcodeModule = QrcodeModule;
exports.QrcodeModule = QrcodeModule = __decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule],
        controllers: [qrcode_controller_1.QRCodesController],
        providers: [qrcode_service_1.QRCodesService, ...qrcode_provider_1.QrCodeProvider]
    })
], QrcodeModule);
//# sourceMappingURL=qrcode.module.js.map