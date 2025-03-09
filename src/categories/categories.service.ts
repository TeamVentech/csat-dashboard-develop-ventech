import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { In, Repository } from 'typeorm';
import { Category } from './entities/categories.entity';
import { CreateCategoryDto } from './dto/create.dto';
import { UpdateCategoryDto } from './dto/update.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class CategoriesService {
  constructor(
    @Inject('CATEGORY_REPOSITORY')
    private categoryRepository: Repository<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto) {
    const category = plainToInstance(Category, createCategoryDto);
    return this.categoryRepository.save(category);
  
  }

  async findAll(page, perPage, filterOptions) {
    page = page || 1;
    perPage = perPage || 10;
    const queryBuilder = this.categoryRepository.createQueryBuilder('user');

    // Apply filters based on filterOptions
    if (filterOptions) {
      if (filterOptions.search) {
        const searchString =await filterOptions.search.startsWith(' ')
          ? filterOptions.search.replace(' ', '+')
          : filterOptions.search;
        filterOptions.search = searchString
        queryBuilder.andWhere('(user.type LIKE :search)', {
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
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return category;
  }

  async findByType(type: string) {
    console.log(type)
    let searchTypes = [type];
  
    if (type === 'Complaint') {
      searchTypes = ['Mall Complaint', 'Shops Complaint', 'Tenant Complaint'];
    }
  
    const categories = await this.categoryRepository.find({
      where: { type: In(searchTypes) },
    });
  
    if (!categories.length) {
      throw new NotFoundException(`No categories found for type ${type}`);
    }
  
    return categories;
  }
  

  async findByComplaintType(type: string){
    const category = await this.categoryRepository.find({ where: {  type } });
    if (!category) {
      throw new NotFoundException(`Category with ID ${type} not found`);
    }
    return category;
  }

  async findAllCategory() {
    return this.categoryRepository.find();
  }


  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    await this.findOne(id);
    await this.categoryRepository.update(id, updateCategoryDto);
    return this.findOne(id);
  }

  // Delete a category by ID
  async remove(id: string) {
    const category = await this.findOne(id);
    await this.categoryRepository.remove(category);
  }
}
