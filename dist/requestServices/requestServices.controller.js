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
exports.RequestServicesController = void 0;
const common_1 = require("@nestjs/common");
const requestServices_service_1 = require("./requestServices.service");
const transform_interceptor_1 = require("../interceptors/transform.interceptor");
const passport_1 = require("@nestjs/passport");
const permissions_guard_1 = require("../guards/permissions.guard");
const permissions_decorator_1 = require("../decorator/permissions.decorator");
const elasticsearch_service_1 = require("../ElasticSearch/elasticsearch.service");
let RequestServicesController = class RequestServicesController {
    constructor(requestServicesService, elasticSearchService) {
        this.requestServicesService = requestServicesService;
        this.elasticSearchService = elasticSearchService;
    }
    create(createRequestServicesDto) {
        return this.requestServicesService.create(createRequestServicesDto);
    }
    findAll(page, perPage, search) {
        const filterOptions = {
            search
        };
        return this.requestServicesService.findAll(page, perPage, filterOptions);
    }
    findOne(id) {
        return this.requestServicesService.findOne(id);
    }
    findType(type) {
        return this.requestServicesService.findType(type);
    }
    update(id, updateRequestServicesDto) {
        return this.requestServicesService.update(id, updateRequestServicesDto);
    }
    rating(id, rate) {
        console.log('fffffffffffffffff');
        return this.requestServicesService.rating(id, rate);
    }
    remove(id) {
        return this.requestServicesService.remove(id);
    }
    elasticSerchQurey(page, perPage, search) {
        return this.elasticSearchService.search("services", search, page, perPage);
    }
};
exports.RequestServicesController = RequestServicesController;
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('Service::write'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), permissions_guard_1.PermissionsGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RequestServicesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('Service::read'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), permissions_guard_1.PermissionsGuard),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('perPage')),
    __param(2, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String]),
    __metadata("design:returntype", void 0)
], RequestServicesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.Permissions)('Service::read'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), permissions_guard_1.PermissionsGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RequestServicesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)('type/:type'),
    (0, permissions_decorator_1.Permissions)('Service::read'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), permissions_guard_1.PermissionsGuard),
    __param(0, (0, common_1.Param)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RequestServicesController.prototype, "findType", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, permissions_decorator_1.Permissions)('Service::update'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), permissions_guard_1.PermissionsGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RequestServicesController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/rating'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RequestServicesController.prototype, "rating", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.Permissions)('Service::delete'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RequestServicesController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)('search/query'),
    (0, permissions_decorator_1.Permissions)('Service::read'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), permissions_guard_1.PermissionsGuard),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('perPage')),
    __param(2, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Object]),
    __metadata("design:returntype", void 0)
], RequestServicesController.prototype, "elasticSerchQurey", null);
exports.RequestServicesController = RequestServicesController = __decorate([
    (0, common_1.Controller)('request-services'),
    (0, common_1.UseInterceptors)(common_1.ClassSerializerInterceptor),
    (0, common_1.UseInterceptors)(transform_interceptor_1.TransformInterceptor),
    __metadata("design:paramtypes", [requestServices_service_1.RequestServicesService, elasticsearch_service_1.ElasticService])
], RequestServicesController);
//# sourceMappingURL=requestServices.controller.js.map