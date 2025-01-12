import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubCategory } from './entities/subcategories.entity';
import { CreateSubCategoryDto } from './dto/create.dto';
import { UpdateSubCategoryDto } from './dto/update.dto';
import { Category } from '../categories/entities/categories.entity';

@Injectable()
export class SubCategoriesService {
  constructor(
    @Inject('SUBCATEGORY_REPOSITORY')
    private readonly subCategoryRepository: Repository<SubCategory>,

    @Inject('CATEGORY_REPOSITORY')
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(createSubCategoryDto: CreateSubCategoryDto) {
    const category = await this.categoryRepository.findOne({ where: { id: createSubCategoryDto.categoryId } });
    if (!category) {
      throw new NotFoundException(`Category with ID ${createSubCategoryDto.categoryId} not found`);
    }

    const subCategory = this.subCategoryRepository.create({
      ...createSubCategoryDto,
      category,
    });

    return this.subCategoryRepository.save(subCategory);
  }

  async findAll(page: number, perPage: number, filterOptions: any) {
    page = page || 1;
    perPage = perPage || 10;
  
    const queryBuilder = this.subCategoryRepository.createQueryBuilder('subCategories')
      .leftJoinAndSelect('subCategories.category', 'category') // Include customer relationship
      .leftJoinAndSelect('subCategories.location', 'location');
    // Apply filters based on filterOpdtions
    if (filterOptions) {
      if (filterOptions.search) {
        const searchString = filterOptions.search.trim().startsWith(' ')
          ? filterOptions.search.replace(' ', '+')
          : filterOptions.search;
  
        filterOptions.search = searchString;
  
        queryBuilder.andWhere('(subCategories.name ILIKE :search)', {
          search: `%${filterOptions.search}%`, // Use wildcards for substring search
        });
      }
  
      Object.keys(filterOptions).forEach(key => {
        if (key !== 'search' && filterOptions[key]) {
          queryBuilder.andWhere(`subCategories.${key} = :${key}`, { [key]: filterOptions[key] });
        }
      });
    }
  
    const [categories, total] = await queryBuilder
      .skip((page - 1) * perPage)
      .take(perPage)
      .getManyAndCount();
  
    return { categories, total };
  }
  async findOne(id: string) {
    return this.subCategoryRepository.findOne({
      where: { id },
      relations: ['category','location'], // Fetch customer relationship
    });
  }
  
  async getAll() {
    return this.subCategoryRepository.find({
      relations: ['category','location'],
    });
  }
  async update(id: string, updateSubCategoryDto: UpdateSubCategoryDto) {
    await this.findOne(id);
    await this.subCategoryRepository.update(id, updateSubCategoryDto);
    return this.findOne(id);
  }

  async remove(id: string) {
    const subCategory = await this.findOne(id);
    await this.subCategoryRepository.remove(subCategory);
  }
}
