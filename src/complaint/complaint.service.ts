import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Complaints } from './entities/complaint.entity';
import { CreateComplaintServicesDto } from './dto/create.dto';
import { UpdateComplaintServicesDto } from './dto/update.dto';

@Injectable()
export class ComplaintsService {
  constructor(
    @Inject('COMPLAINT_SERVICES_REPOSITORY')
    private readonly complaintsRepository: Repository<Complaints>,
  ) {}

  async create(createComplaintsDto: CreateComplaintServicesDto) {
    const department = this.complaintsRepository.create(createComplaintsDto);
    return this.complaintsRepository.save(department);
  }

  async findAll(page, perPage, filterOptions) {
    page = page || 1;
    perPage = perPage || 10;
    const queryBuilder = this.complaintsRepository.createQueryBuilder('user')
    .leftJoinAndSelect('user.customer', 'customer')
    .leftJoinAndSelect('user.category', 'category')
    // Apply filters based on filterOptions
    if (filterOptions) {    
      if (filterOptions.search) {
        const searchString =await filterOptions.search.startsWith(' ')
          ? filterOptions.search.replace(' ', '+')
          : filterOptions.search;
        filterOptions.search = searchString
        queryBuilder.andWhere('(customer.name ILIKE :search)', {
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
    const Complaints = await this.complaintsRepository.findOne({ where: { id: id } });
    if (!Complaints) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }
    return Complaints;
  }

  async findType(type: string){
    const Complaints = await this.complaintsRepository.find({ where: { type: type } });
    if (!Complaints) {
      throw new NotFoundException(`Department with ID ${type} not found`);
    }
    return Complaints;
  }


  // Update a department by ID
  async update(id: string, updateComplaintsDto: UpdateComplaintServicesDto) {
    await this.findOne(id);
    await this.complaintsRepository.update(id, updateComplaintsDto);
    return this.findOne(id);
  }

  async remove(id: string) {
    const Complaints = await this.findOne(id);
    await this.complaintsRepository.remove(Complaints);
  }
}
