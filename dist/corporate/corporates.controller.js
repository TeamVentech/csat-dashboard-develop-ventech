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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CorporatesController = void 0;
const common_1 = require("@nestjs/common");
const corporates_service_1 = require("./corporates.service");
const create_dto_1 = require("./dto/create.dto");
const update_dto_1 = require("./dto/update.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const transform_interceptor_1 = require("../interceptors/transform.interceptor");
const passport_1 = require("@nestjs/passport");
const permissions_guard_1 = require("../guards/permissions.guard");
const permissions_decorator_1 = require("../decorator/permissions.decorator");
let CorporatesController = class CorporatesController {
    constructor(corporatesService) {
        this.corporatesService = corporatesService;
    }
    async create(createCorporateDto) {
        return this.corporatesService.create(createCorporateDto);
    }
    findAll(page, perPage, search) {
        const filterOptions = {
            search
        };
        return this.corporatesService.findAll(page, perPage, filterOptions);
    }
    async findOne(id) {
        return this.corporatesService.findOne(id);
    }
    async update(id, updatecorporateDto) {
        return this.corporatesService.update(id, updatecorporateDto);
    }
    async remove(id) {
        return this.corporatesService.remove(id);
    }
};
exports.CorporatesController = CorporatesController;
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('Corporate::read'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_dto_1.CreateCorporateDto]),
    __metadata("design:returntype", Promise)
], CorporatesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('Corporate::read'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('perPage')),
    __param(2, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String]),
    __metadata("design:returntype", void 0)
], CorporatesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.Permissions)('Corporate::read'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CorporatesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, permissions_decorator_1.Permissions)('Corporate::update'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_dto_1.UpdateCorporateDto]),
    __metadata("design:returntype", Promise)
], CorporatesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, permissions_decorator_1.Permissions)('Corporate::delete'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CorporatesController.prototype, "remove", null);
exports.CorporatesController = CorporatesController = __decorate([
    (0, common_1.Controller)('corprates'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), permissions_guard_1.PermissionsGuard),
    (0, common_1.UseInterceptors)(common_1.ClassSerializerInterceptor),
    (0, common_1.UseInterceptors)(transform_interceptor_1.TransformInterceptor),
    __metadata("design:paramtypes", [corporates_service_1.CorporatesService])
], CorporatesController);
//# sourceMappingURL=corporates.controller.js.map