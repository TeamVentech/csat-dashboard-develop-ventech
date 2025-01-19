import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from './entities/departments.entity';
import { CreateDepartmentDto } from './dto/create.dto';
import { UpdateDepartmentDto } from './dto/update.dto';
import { ElasticService } from 'ElasticSearch/elasticsearch.service';

@Injectable()
export class DepartmentsService {
  constructor(
    @Inject('DEPARTMENT_REPOSITORY')
    private readonly departmentRepository: Repository<Department>,
    private readonly elasticService: ElasticService,
  ) { }

  async create(createDepartmentDto: CreateDepartmentDto) {
    const department = this.departmentRepository.create(createDepartmentDto);
    const data = await this.departmentRepository.save(department);
    await this.elasticService.indexData('department', department.id, data);
    return data
  }

  async findAll(page, perPage, search) {
    return await this.elasticService.search("department", search, page, perPage);
  }


  async find() {
    const roles = await this.elasticService.getAllDocuments("department")
    return roles;
  }

  async findOne(id: string) {
    const department = await this.elasticService.getById('department', id);
    if (!department) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }
    return department;
  }

  // Update a department by ID
  async update(id: string, updateDepartmentDto: UpdateDepartmentDto) {
    const data = await this.departmentRepository.findOne({ where: { id: id } });
    data.name = updateDepartmentDto.name
    await this.departmentRepository.update(id, data);
    await this.elasticService.updateDocument('department', id, data);
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.elasticService.deleteDocument('department', id);
    return {}
  }
}
