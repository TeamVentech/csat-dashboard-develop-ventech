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
exports.TouchPointsController = void 0;
const common_1 = require("@nestjs/common");
const touch_points_service_1 = require("./touch-points.service");
const update_dto_1 = require("./dto/update.dto");
const transform_interceptor_1 = require("../interceptors/transform.interceptor");
const passport_1 = require("@nestjs/passport");
const permissions_guard_1 = require("../guards/permissions.guard");
const permissions_decorator_1 = require("../decorator/permissions.decorator");
let TouchPointsController = class TouchPointsController {
    constructor(touchPointsService) {
        this.touchPointsService = touchPointsService;
    }
    create(createTouchPointDto) {
        return this.touchPointsService.create(createTouchPointDto);
    }
    findAll(page = 1, perPage = 10, filter = '') {
        return this.touchPointsService.findAll(page, perPage, filter);
    }
    findAllSearch(page = 1, perPage = 10, filter = '', type = '') {
        return this.touchPointsService.findAllSearch(page, perPage, filter, type);
    }
    findAllCategory() {
        return this.touchPointsService.findAllCategory();
    }
    findOne(id) {
        return this.touchPointsService.findOne(id);
    }
    findByCategory(id) {
        return this.touchPointsService.findByCategory(id);
    }
    findHLRating() {
        return this.touchPointsService.findHighestRated();
    }
    findLowestRated() {
        return this.touchPointsService.findLowestRated();
    }
    update(id, updateTouchPointDto) {
        return this.touchPointsService.updaterochpoint(id, updateTouchPointDto);
    }
    remove(id) {
        return this.touchPointsService.remove(id);
    }
};
exports.TouchPointsController = TouchPointsController;
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('Lookups::write'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TouchPointsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('Lookups::read'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('perPage')),
    __param(2, (0, common_1.Query)('filter')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String]),
    __metadata("design:returntype", void 0)
], TouchPointsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('search/all'),
    (0, permissions_decorator_1.Permissions)('Lookups::read'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('perPage')),
    __param(2, (0, common_1.Query)('filter')),
    __param(3, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String, String]),
    __metadata("design:returntype", void 0)
], TouchPointsController.prototype, "findAllSearch", null);
__decorate([
    (0, common_1.Get)('touchpoint/all'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TouchPointsController.prototype, "findAllCategory", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.Permissions)('Lookups::read'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TouchPointsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)('category/:id'),
    (0, permissions_decorator_1.Permissions)('Lookups::read'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TouchPointsController.prototype, "findByCategory", null);
__decorate([
    (0, common_1.Get)('/rating/high'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TouchPointsController.prototype, "findHLRating", null);
__decorate([
    (0, common_1.Get)('/rating/low'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TouchPointsController.prototype, "findLowestRated", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, permissions_decorator_1.Permissions)('Lookups::update'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_dto_1.UpdateTouchPointDto]),
    __metadata("design:returntype", void 0)
], TouchPointsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, permissions_decorator_1.Permissions)('Lookups::delete'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TouchPointsController.prototype, "remove", null);
exports.TouchPointsController = TouchPointsController = __decorate([
    (0, common_1.Controller)('touchpoints'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), permissions_guard_1.PermissionsGuard),
    (0, common_1.UseInterceptors)(common_1.ClassSerializerInterceptor),
    (0, common_1.UseInterceptors)(transform_interceptor_1.TransformInterceptor),
    __metadata("design:paramtypes", [touch_points_service_1.TouchPointsService])
], TouchPointsController);
//# sourceMappingURL=touch-points.controller.js.map