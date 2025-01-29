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
    console.log(filterOptions)
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
    };

    // Populate the result with counts
    counts.forEach((count) => {
      if (result.hasOwnProperty(count.status)) {
        result[count.status] = parseInt(count.count, 10);
      }
    });

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
    console.log(type)
    console.log(status)
    const Services = await this.servicesRepository.findOne({ where: { type, status } });
    if (!Services) {
      console.log(`Service with Type ${type} & ${status} not found`);
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
    await this.findOne(id);
    await this.servicesRepository.update(id, updateServicesDto);
    return this.findOne(id);
  }

  async remove(id: string) {
    const Services = await this.findOne(id);
    await this.servicesRepository.remove(Services);
  }
}
