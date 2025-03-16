import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './entities/tenants.entity';
import { CreateTenantDto } from './dto/create.dto';
import { UpdateTenantDto } from './dto/update.dto';

@Injectable()
export class TenantsService {
  constructor(
    @Inject('TENANTS_REPOSITORY')
    private readonly tenantRepository: Repository<Tenant>,
  ) { }

  async create(createTenantDto: CreateTenantDto) {
    const tenant = this.tenantRepository.create(createTenantDto);
    return this.tenantRepository.save(tenant);
  }

  async findAll(page, perPage, filterOptions) {
    page = page || 1;
    perPage = perPage || 10;
    const queryBuilder = this.tenantRepository.createQueryBuilder('user');

    // Apply filters based on filterOptions
    if (filterOptions) {
      if (filterOptions.search) {
        const searchString = await filterOptions.search.startsWith(' ')
          ? filterOptions.search.replace(' ', '+')
          : filterOptions.search;
        filterOptions.search = searchString
        queryBuilder.andWhere('(user.name ILIKE :search)', {
          search: `%${filterOptions.search}%`, // Use wildcards for substring search
        });
      }
      Object.keys(filterOptions).forEach(key => {
        if (key !== 'search' && filterOptions[key]) {
          queryBuilder.andWhere(`user.${key} = :${key}`, { [key]: filterOptions[key] });
        }
      });
    }
    queryBuilder.orderBy('user.updatedAt', 'DESC');

    const [categories, total] = await queryBuilder
      .skip((page - 1) * perPage)
      .take(perPage)
      .getManyAndCount();

    return { categories, total };
  }
  async findOne(id: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({ where: { id } });
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }
    return tenant;
  }

  async update(id: string, updateTenantDto: UpdateTenantDto): Promise<Tenant> {
    await this.findOne(id);
    await this.tenantRepository.update(id, updateTenantDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const tenant = await this.findOne(id); // Check if the tenant exists
    await this.tenantRepository.remove(tenant);
  }
}
