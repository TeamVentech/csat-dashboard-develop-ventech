import { Inject, Injectable, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Corporate } from './entities/corporates.entity';
import { CreateCorporateDto } from './dto/create.dto';
import { UpdateCorporateDto } from './dto/update.dto';
import { PhoneValidator } from '../utils/phone-validator.util';

@Injectable()
export class CorporatesService {
  constructor(
    @Inject('CORPORTES_REPOSITORY')
    private readonly corporateRepository: Repository<Corporate>,
  ) { }

  async create(createCorporateDto: CreateCorporateDto): Promise<Corporate> {
    try {
      // Format phone number if provided
      if (createCorporateDto.phone_number) {
        createCorporateDto.phone_number = PhoneValidator.formatPhoneNumber(createCorporateDto.phone_number);
      }
      
      // Format email to lowercase if provided
      if (createCorporateDto.email) {
        createCorporateDto.email = createCorporateDto.email.toLowerCase();
      }
      
      const Corporate = this.corporateRepository.create(createCorporateDto);
      return this.corporateRepository.save(Corporate);
    } catch (error) {
      throw new HttpException(error.message || 'Failed to create corporate', HttpStatus.BAD_REQUEST);
    }
  }

  async findAll(page, perPage, filterOptions) {
    page = page || 1;
    perPage = perPage || 10;
    const queryBuilder = this.corporateRepository.createQueryBuilder('user');

    // Apply filters based on filterOptions
    if (filterOptions) {
      if (filterOptions.search) {
        const searchString = await filterOptions.search.startsWith(' ')
          ? filterOptions.search.replace(' ', '+')
          : filterOptions.search;
        filterOptions.search = searchString
        queryBuilder.andWhere('(user.email ILIKE :search OR user.name ILIKE :search OR user.phone_number ILIKE :search)', {
          search: `%${filterOptions.search}%`, // Use wildcards for substring search
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
  async findOne(id: string): Promise<Corporate> {
    const Corporate = await this.corporateRepository.findOne({ where: { id } });
    if (!Corporate) {
      throw new NotFoundException(`Corporate with ID ${id} not found`);
    }
    return Corporate;
  }

  async findAllCorporate(){
    const Corporate = await this.corporateRepository.find();
    return Corporate;
  }

  async find(name: string) {
    const queryBuilder = this.corporateRepository.createQueryBuilder('user');
    queryBuilder.andWhere('(user.name ILIKE :search)', {
      search: `%${name}%`, // Use wildcards for substring search
    });
    const res = await queryBuilder
    .getManyAndCount()
    return res[0];
    // return await this.corporat eRepository.find({ where: { name } });
  }

  async update(id: string, updateCorporateDto: UpdateCorporateDto): Promise<Corporate> {
    await this.findOne(id);
    
    // Format phone number if provided in update
    if (updateCorporateDto.phone_number) {
      updateCorporateDto.phone_number = PhoneValidator.formatPhoneNumber(updateCorporateDto.phone_number);
    }
    
    // Format email to lowercase if provided
    if (updateCorporateDto.email) {
      updateCorporateDto.email = updateCorporateDto.email.toLowerCase();
    }
    
    await this.corporateRepository.update(id, updateCorporateDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const Corporate = await this.findOne(id); // Check if the Corporate exists
    await this.corporateRepository.remove(Corporate);
  }
}
