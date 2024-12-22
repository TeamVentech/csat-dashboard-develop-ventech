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
let DepartmentsService = class DepartmentsService {
    constructor(departmentRepository) {
        this.departmentRepository = departmentRepository;
    }
    async create(createDepartmentDto) {
        console.log('createDepartmentDto');
        console.log('createDepartmentDto');
        console.log(createDepartmentDto);
        const department = this.departmentRepository.create(createDepartmentDto);
        return this.departmentRepository.save(department);
    }
    async findAll(page, perPage, filterOptions) {
        page = page || 1;
        perPage = perPage || 10;
        const queryBuilder = this.departmentRepository.createQueryBuilder('user');
        if (filterOptions) {
            if (filterOptions.search) {
                const searchString = await filterOptions.search.startsWith(' ')
                    ? filterOptions.search.replace(' ', '+')
                    : filterOptions.search;
                filterOptions.search = searchString;
                queryBuilder.andWhere('(user.name LIKE :search)', {
                    search: `%${filterOptions.search}%`,
                });
            }
            Object.keys(filterOptions).forEach(key => {
                if (key !== 'search' && filterOptions[key]) {
                    queryBuilder.andWhere(`user.${key} = :${key}`, { [key]: filterOptions[key] });
                }
            });
        }
        const [categories, total] = await queryBuilder
            .skip((page - 1) * perPage)
            .take(perPage)
            .getManyAndCount();
        return { categories, total };
    }
    async find() {
        const roles = await this.departmentRepository.find();
        return roles;
    }
    async findOne(id) {
        const department = await this.departmentRepository.findOne({ where: { id: id } });
        if (!department) {
            throw new common_1.NotFoundException(`Department with ID ${id} not found`);
        }
        return department;
    }
    async update(id, updateDepartmentDto) {
        await this.findOne(id);
        await this.departmentRepository.update(id, updateDepartmentDto);
        return this.findOne(id);
    }
    async remove(id) {
        const department = await this.findOne(id);
        await this.departmentRepository.remove(department);
    }
};
exports.DepartmentsService = DepartmentsService;
exports.DepartmentsService = DepartmentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('DEPARTMENT_REPOSITORY')),
    __metadata("design:paramtypes", [typeorm_1.Repository])
], DepartmentsService);
//# sourceMappingURL=departments.service.js.map