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
exports.DepartmentsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const elasticsearch_service_1 = require("../ElasticSearch/elasticsearch.service");
let DepartmentsService = class DepartmentsService {
    constructor(departmentRepository, elasticService) {
        this.departmentRepository = departmentRepository;
        this.elasticService = elasticService;
    }
    async create(createDepartmentDto) {
        const department = this.departmentRepository.create(createDepartmentDto);
        const data = await this.departmentRepository.save(department);
        await this.elasticService.indexData('department', department.id, data);
        return data;
    }
    async findAll(page, perPage, search) {
        return await this.elasticService.search("department", search, page, perPage);
    }
    async find() {
        const roles = await this.elasticService.getAllDocuments("department");
        return roles;
    }
    async findOne(id) {
        const department = await this.elasticService.getById('department', id);
        if (!department) {
            throw new common_1.NotFoundException(`Department with ID ${id} not found`);
        }
        return department;
    }
    async update(id, updateDepartmentDto) {
        const data = await this.departmentRepository.findOne({ where: { id: id } });
        data.name = updateDepartmentDto.name;
        await this.departmentRepository.update(id, data);
        await this.elasticService.updateDocument('department', id, data);
        return this.findOne(id);
    }
    async remove(id) {
        await this.elasticService.deleteDocument('department', id);
        return {};
    }
};
exports.DepartmentsService = DepartmentsService;
exports.DepartmentsService = DepartmentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('DEPARTMENT_REPOSITORY')),
    __metadata("design:paramtypes", [typeorm_1.Repository,
        elasticsearch_service_1.ElasticService])
], DepartmentsService);
//# sourceMappingURL=departments.service.js.map