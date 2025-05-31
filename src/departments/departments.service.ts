import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
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
    return data
  }

  async findAll(page, perPage, filterOptions) {
    page = page || 1;
    perPage = perPage || 10;
    const queryBuilder = this.departmentRepository.createQueryBuilder('department')

    // Apply filters based on filterOptions
    if (filterOptions) {
      if (filterOptions.search) {
        queryBuilder.andWhere('(department.name ILIKE :search OR department.id::text ILIKE :search)', {
          search: `%${filterOptions.search}%`, // Use wildcards for substring search
        });

      }

      Object.keys(filterOptions).forEach(key => {
        if (key !== 'search' && filterOptions[key]) {
          queryBuilder.andWhere(`department.${key} = :${key}`, { [key]: filterOptions[key] });
        }
      });

      queryBuilder.orderBy('department.createdAt', 'DESC');
    }

    const [categories, total] = await queryBuilder
      .skip((page - 1) * perPage)
      .take(perPage)
      .getManyAndCount();

    return { categories, total };
  }



  async find() {
    const departments = await this.departmentRepository.find();
    // const roles = await this.elasticService.getAllDocuments("department")
    return departments;
  }

  async findOne(id: string) {
    const department = await this.departmentRepository.findOne({ where: { id: id } });
    // const department = await this.elasticService.getById('department', id);
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
    // await this.elasticService.updateDocument('department', id, data);
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.departmentRepository.delete(id);
    // await this.elasticService.deleteDocument('department', id);
    return {}
  }

  async removeMultiple(ids: string[]) {
    const results = [];
    
    for (const id of ids) {
      try {
        await this.departmentRepository.delete(id);
        // await this.elasticService.deleteDocument('department', id);
        results.push({ id, success: true });
      } catch (error) {
        results.push({ id, success: false, message: error.message });
      }
    }
    
    return {
      message: 'Departments deletion completed',
      results
    };
  }
}
