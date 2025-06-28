import { HttpException, HttpStatus, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Services } from './entities/services.entity';
import { CreateServicesDto } from './dto/create.dto';
import { UpdateServicesDto } from './dto/update.dto';

@Injectable()
export class ServicesService {
  constructor(
    @Inject('SERVICES_REPOSITORY')
    private readonly servicesRepository: Repository<Services>,
  ) { }

  async create(createServicesDto: CreateServicesDto) {
    const department = this.servicesRepository.create(createServicesDto);
    return this.servicesRepository.save(department);
  }

  async findAll(page, perPage, filterOptions) {
    page = page || 1;
    perPage = perPage || 10;
    const queryBuilder = this.servicesRepository.createQueryBuilder('services');
    if (filterOptions) {
      if (filterOptions.search) {
        queryBuilder.andWhere('(services.status LIKE :search)', {
          search: `%${filterOptions.search}%`, // Use wildcards for substridfng search
        });
      }

      Object.keys(filterOptions).forEach(key => {
        if (key !== 'search' && filterOptions[key]) {
          queryBuilder.andWhere(`services.${key} = :${key}`, { [key]: filterOptions[key] });
        }
      });
    }
    queryBuilder.orderBy('services.updatedAt', 'DESC');

    const [data, total] = await queryBuilder
      .skip((page - 1) * perPage)
      .take(perPage)
      .getManyAndCount();

    return { data, total };
  }

  async getServiceStatusCounts(type: string) {
    const counts = await this.servicesRepository
      .createQueryBuilder('service')
      .select('service.status, COUNT(service.id)', 'count')
      .where('service.type = :type', { type })
      .groupBy('service.status')
      .getRawMany();

    // Initialize the result
    const result = {
      AVAILABLE: 0,
      UNAVAILABLE: 0,
      OCCUPIED: 0,
      TEMPORARY: 0,
    };

    // Populate the result with counts
    counts.forEach((count) => {
      if (result.hasOwnProperty(count.status)) {
        result[count.status] = parseInt(count.count, 10);
      }
    });

    return result;
  }

  async getAllServiceStatusCounts() {
    const types = await this.servicesRepository
      .createQueryBuilder('service')
      .select('DISTINCT service.type', 'type')
      .getRawMany();

    const result = {};
    for (const t of types) {
      const type = t.type;
      result[type] = await this.getServiceStatusCounts(type);
    }
    return result;
  }

  async findOne(id: string) {
    const Services = await this.servicesRepository.findOne({ where: { id: id } });
    if (!Services) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }
    return Services;
  }
  async findOneByTypeStatus(type: string, status: string) {
    const Services = await this.servicesRepository.findOne({ where: { type, status } });
    if (!Services) {
    }
    return Services;
  }

  // async findType(type: string){
  //   const Services = await this.servicesRepository.find({ where: { type: type } });
  //   if (!Services) {dd
  //     throw new NotFoundException(`Department with ID ${type} not found`);
  //   }
  //   return Services;
  // }


  // Update a department by ID
  async update(id: string, updateServicesDto: UpdateServicesDto) {
    // Check if id is valid
    if (!id || id.trim() === '') {
      throw new HttpException('Invalid service ID', HttpStatus.BAD_REQUEST);
    }

    // Check if updateServicesDto has at least one property
    if (!updateServicesDto || Object.keys(updateServicesDto).length === 0) {
      throw new HttpException('Update data cannot be empty', HttpStatus.BAD_REQUEST);
    }

    // First check if the service exists
    const service = await this.findOne(id);

    try {
      await this.servicesRepository.update(id, updateServicesDto);
      return this.findOne(id);
    } catch (error) {
      console.error('Update error:', error);
      throw new HttpException(
        'Failed to update service: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async remove(id: string) {
    const Services = await this.findOne(id);
    await this.servicesRepository.remove(Services);
  }
}
