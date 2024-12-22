import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequestServices } from './entities/requestServices.entity';
import { CreateRequestServicesDto } from './dto/create.dto';
import { UpdateRequestServicesDto } from './dto/update.dto';

@Injectable()
export class RequestServicesService {
  constructor(
    @Inject('REQUEST_SERVICES_REPOSITORY')
    private readonly requestServicesRepository: Repository<RequestServices>,
  ) {}

  async create(createRequestServicesDto: CreateRequestServicesDto) {
    console.log(createRequestServicesDto)
    const department = this.requestServicesRepository.create(createRequestServicesDto);
    return this.requestServicesRepository.save(department);
  }

  async findAll(page, perPage, filterOptions) {
    page = page || 1;
    perPage = perPage || 10;
    const queryBuilder = this.requestServicesRepository.createQueryBuilder('user');

    // Apply filters based on filterOptions
    if (filterOptions) {
      if (filterOptions.search) {
        const searchString =await filterOptions.search.startsWith(' ')
          ? filterOptions.search.replace(' ', '+')
          : filterOptions.search;
        filterOptions.search = searchString
        queryBuilder.andWhere('(user.name LIKE :search)', {
          search: `%${filterOptions.search}%`, // Use wildcards for substring search
        });

      }

      Object.keys(filterOptions).forEach(key => {
        if (key !== 'search' && filterOptions[key]) {
          queryBuilder.andWhere(`user.${key} = :${key}`, { [key]: filterOptions[key] });
        }
      });
    }

    const [data, total] = await queryBuilder
      .skip((page - 1) * perPage)
      .take(perPage)
      .getManyAndCount();

    return { data, total };
  }

  async findOne(id: string){
    const RequestServices = await this.requestServicesRepository.findOne({ where: { id: id } });
    if (!RequestServices) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }
    return RequestServices;
  }

  async findType(type: string){
    const RequestServices = await this.requestServicesRepository.find({ where: { type: type } });
    if (!RequestServices) {
      throw new NotFoundException(`Department with ID ${type} not found`);
    }
    return RequestServices;
  }


  // Update a department by ID
  async update(id: string, updateRequestServicesDto: UpdateRequestServicesDto) {
    await this.findOne(id);
    await this.requestServicesRepository.update(id, updateRequestServicesDto);
    return this.findOne(id);
  }

  async remove(id: string) {
    const RequestServices = await this.findOne(id);
    await this.requestServicesRepository.remove(RequestServices);
  }
}
