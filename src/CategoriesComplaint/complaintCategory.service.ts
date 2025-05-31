import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ComplaintCategory } from './entities/complaintCategory.entity';
import { CreateComplaintCategoryDto } from './dto/create.dto';
import { UpdateComplaintCategoryDto } from './dto/update.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class ComplaintCategoryService {
  constructor(
    @Inject('COMPLAINT_CATEGORY_REPOSITORY')
    private categoryRepository: Repository<ComplaintCategory>,
  ) {}

  async create(createComplaintCategoryDto: CreateComplaintCategoryDto) {
    const category = plainToInstance(ComplaintCategory, createComplaintCategoryDto);
    return this.categoryRepository.save(category);
  }

  async findAll(page, perPage, filterOptions) {
    page = page || 1;
    perPage = perPage || 10;
    const queryBuilder = this.categoryRepository.createQueryBuilder('user');

    if (filterOptions) {
      if (filterOptions.search) {
        const searchString =await filterOptions.search.startsWith(' ')
          ? filterOptions.search.replace(' ', '+')
          : filterOptions.search;
        filterOptions.search = searchString
        queryBuilder.andWhere('(user.name ILIKE :search OR user.description ILIKE :search)', {
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


  async findOne(id: string){
    const category = await this.categoryRepository.findOne({ where: { id: id } });
    if (!category) {
      throw new NotFoundException(`ComplaintCategory with ID ${id} not found`);
    }
    return category;
  }


  async findAllComplaintCategory() {
    return this.categoryRepository.find();
  }


  async update(id: string, updateComplaintCategoryDto: UpdateComplaintCategoryDto) {
    await this.findOne(id);
    await this.categoryRepository.update(id, updateComplaintCategoryDto);
    return this.findOne(id);
  }

  async remove(id: string) {
    const category = await this.findOne(id);
    await this.categoryRepository.remove(category);
  }

  async removeMultiple(ids: string[]) {
    const results = [];
    
    for (const id of ids) {
      try {
        const category = await this.findOne(id);
        await this.categoryRepository.remove(category);
        results.push({ id, success: true });
      } catch (error) {
        results.push({ id, success: false, message: error.message });
      }
    }
    
    return {
      message: 'Categories deletion completed',
      results
    };
  }
}
