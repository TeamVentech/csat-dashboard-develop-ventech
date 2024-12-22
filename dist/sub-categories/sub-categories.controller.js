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
exports.SubCategoriesController = void 0;
const common_1 = require("@nestjs/common");
const sub_categories_service_1 = require("./sub-categories.service");
const create_dto_1 = require("./dto/create.dto");
const update_dto_1 = require("./dto/update.dto");
const transform_interceptor_1 = require("../interceptors/transform.interceptor");
const passport_1 = require("@nestjs/passport");
const permissions_guard_1 = require("../guards/permissions.guard");
const permissions_decorator_1 = require("../decorator/permissions.decorator");
let SubCategoriesController = class SubCategoriesController {
    constructor(subCategoriesService) {
        this.subCategoriesService = subCategoriesService;
    }
    create(createSubCategoryDto) {
        return this.subCategoriesService.create(createSubCategoryDto);
    }
    findAll(page = 1, perPage = 10, filter = '') {
        return this.subCategoriesService.findAll(page, perPage, filter);
    }
    findOne(id) {
        return this.subCategoriesService.findOne(id);
    }
    GetAll() {
        return this.subCategoriesService.getAll();
    }
    update(id, updateSubCategoryDto) {
        return this.subCategoriesService.update(id, updateSubCategoryDto);
    }
    remove(id) {
        return this.subCategoriesService.remove(id);
    }
};
exports.SubCategoriesController = SubCategoriesController;
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('Survey::write'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_dto_1.CreateSubCategoryDto]),
    __metadata("design:returntype", void 0)
], SubCategoriesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('Survey::write'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('perPage')),
    __param(2, (0, common_1.Query)('filter')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String]),
    __metadata("design:returntype", void 0)
], SubCategoriesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.Permissions)('Survey::write'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SubCategoriesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)('get/all'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SubCategoriesController.prototype, "GetAll", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, permissions_decorator_1.Permissions)('Survey::update'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_dto_1.UpdateSubCategoryDto]),
    __metadata("design:returntype", void 0)
], SubCategoriesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, permissions_decorator_1.Permissions)('Survey::delete'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SubCategoriesController.prototype, "remove", null);
exports.SubCategoriesController = SubCategoriesController = __decorate([
    (0, common_1.Controller)('subcategories'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), permissions_guard_1.PermissionsGuard),
    (0, common_1.UseInterceptors)(common_1.ClassSerializerInterceptor),
    (0, common_1.UseInterceptors)(transform_interceptor_1.TransformInterceptor),
    __metadata("design:paramtypes", [sub_categories_service_1.SubCategoriesService])
], SubCategoriesController);
//# sourceMappingURL=sub-categories.controller.js.map