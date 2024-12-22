import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Corporate } from './entities/corporates.entity';
import { CreateCorporateDto } from './dto/create.dto';
import { UpdateCorporateDto } from './dto/update.dto';

@Injectable()
export class CorporatesService {
  constructor(
    @Inject('CORPORTES_REPOSITORY')
    private readonly corporateRepository: Repository<Corporate>,
  ) { }

  async create(createCorporateDto: CreateCorporateDto): Promise<Corporate> {
    const Corporate = this.corporateRepository.create(createCorporateDto);
    return this.corporateRepository.save(Corporate);
  }

  async findAll(page, perPage, filterOptions) {
    page = page || 1;
    perPage = perPage || 10;
    const queryBuilder = this.corporateRepository.createQueryBuilder('user');

    // Apply filters based on filterOptions
    if (filterOptions) {
      if (filterOptions.search) {
        const searchString =await filterOptions.search.startsWith(' ')
          ? filterOptions.search.replace(' ', '+')
          : filterOptions.search;
        filterOptions.search = searchString
        queryBuilder.andWhere('(user.email LIKE :search OR user.name LIKE :search OR user.phone_number LIKE :search OR user.gender LIKE :search)', {
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

  async update(id: string, updateCorporateDto: UpdateCorporateDto): Promise<Corporate> {
    await this.findOne(id);
    await this.corporateRepository.update(id, updateCorporateDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const Corporate = await this.findOne(id); // Check if the Corporate exists
    await this.corporateRepository.remove(Corporate);
  }
}
