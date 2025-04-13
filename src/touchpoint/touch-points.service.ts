import { Injectable, NotFoundException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Touchpoint } from './entities/touchpoint.entity';
import { Category } from 'categories/entities/categories.entity';
import { UpdateCategoryDto } from 'categories/dto/update.dto';
import { UpdateTouchPointDto } from './dto/update.dto';
import { FilesS3Service } from 'azure-storage/aws-storage.service';

@Injectable()
export class TouchPointsService {
  constructor(
    @Inject('TOUCHPOINT_REPOSITORY')
    private readonly touchpointRepository: Repository<Touchpoint>,
    @Inject('CATEGORY_REPOSITORY')
    private readonly categoryRepository: Repository<Category>,
    private readonly filesAzureService: FilesS3Service, // Inject TouchPointsSegrvice
  ) {}

  async create(createTouchPointDto: any, file) {
    let avatarUrl = null;
    createTouchPointDto.name = {
      ar: createTouchPointDto.name_ar,
      en: createTouchPointDto.name_en,
    };
    if (file) {
      avatarUrl = await this.filesAzureService.uploadFile(file, 'users');
    }

    const subCategory = this.touchpointRepository.create({
      ...createTouchPointDto,
      avatar: avatarUrl,
    });
    return this.touchpointRepository.save(subCategory);
  }

  // Get all touchpoints with pagination and filtering
  async findAll(page: number, perPage: number, filterOptions: any) {
    page = page || 1;
    perPage = perPage || 10;

    const queryBuilder = this.touchpointRepository
      .createQueryBuilder('touchpoint')
      .leftJoinAndSelect('touchpoint.category', 'category') // Include customer relationship
      .leftJoinAndSelect('touchpoint.location', 'location');
    // Apply filters based on filterOpdtions
    if (filterOptions) {
      if (filterOptions.search) {
        const searchString = filterOptions.search.trim().startsWith(' ')
          ? filterOptions.search.replace(' ', '+')
          : filterOptions.search;

        filterOptions.search = searchString;

        queryBuilder.andWhere('(touchpoint.name ILIKE :search)', {
          search: `%${filterOptions.search}%`, // Use wildcards for substring search
        });
      }

      Object.keys(filterOptions).forEach((key) => {
        if (key !== 'search' && filterOptions[key]) {
          queryBuilder.andWhere(`touchpoint.${key} = :${key}`, {
            [key]: filterOptions[key],
          });
        }
      });
    }

    const [categories, total] = await queryBuilder
      .skip((page - 1) * perPage)
      .take(perPage)
      .getManyAndCount();

    return { categories, total };
  }

  async findAllSearch(
    page: number,
    perPage: number,
    filterOptions: any,
    categoryType: string,
  ) {
    page = page || 1;
    perPage = perPage || 10;

    const queryBuilder = this.touchpointRepository
      .createQueryBuilder('touchpoint')
      .leftJoinAndSelect('touchpoint.category', 'category')
      .where('category.type = :categoryType', { categoryType });

    // Apply filters based on filterOpdtions
    if (filterOptions) {
      if (filterOptions.search) {
        const searchString = filterOptions.search.trim().startsWith(' ')
          ? filterOptions.search.replace(' ', '+')
          : filterOptions.search;

        filterOptions.search = searchString;

        queryBuilder.andWhere('(touchpoint.name ILIKE :search)', {
          search: `%${filterOptions.search}%`, // Use wildcards for substring search
        });
      }
      Object.keys(filterOptions).forEach((key) => {
        if (key !== 'search' && filterOptions[key]) {
          queryBuilder.andWhere(`touchpoint.${key} = :${key}`, {
            [key]: filterOptions[key],
          });
        }
      });
    }
    queryBuilder.orderBy('touchpoint.createdAt', 'DESC');

    const [categories, total] = await queryBuilder
      .skip((page - 1) * perPage)
      .take(perPage)
      .getManyAndCount();

    return { categories, total };
  }

  // Get a single touchpoint by ID
  async findOne(id: string) {
    return this.touchpointRepository.findOne({
      where: { id },
      relations: ['category'], // Fetch customer relationship
    });
  }
  async findByCategory(id: string) {
    return this.touchpointRepository.find({
      where: { categoryId: id },
      select: {
        id: true,
        name: true,
      },
    });
  }

  async getTouchpointsGroupedByCategory(type) {
    const touchpoints = await this.touchpointRepository.find({
      relations: ['category'],
    });

    const grouped = touchpoints.reduce(
      (acc, touchpoint) => {
        if (touchpoint.category?.type === type) {
          const categoryName = touchpoint.category.name.en;

          if (!acc[categoryName]) {
            acc[categoryName] = [];
          }
          acc[categoryName].push(touchpoint);
        }
        return acc;
      },
      {} as Record<string, Touchpoint[]>,
    );

    return Object.entries(grouped).map(([category, touchpoints]) => ({
      category,
      touchpoint: touchpoints,
    }));
  }

  async getAll() {
    return this.touchpointRepository.find({
      relations: ['category'],
      select: {
        id: true,
        name: true,
      },
    });
  }

  async findAllCategory() {
    return this.touchpointRepository.find({
      select: {
        id: true,
        name: true,
      },
    });
  }

  // Update a touchpoint by ID
  async update(id: string, rating: string) {
    const touchPoint = await this.touchpointRepository.findOne({
      where: { id },
    });
    touchPoint.rating = rating;
    touchPoint.countTransaction++;
    const categories = await this.categoryRepository.findOne({
      where: { id: touchPoint.categoryId },
    });
    categories.rating = rating;
    categories.counted = (Number(categories.counted) + 1).toString();
    await this.categoryRepository.save(categories);
    await this.touchpointRepository.save(touchPoint);
  }

  async update_touchpoint(id: string, updateTouchPointDto: any, file) {
    let avatar = null;
    updateTouchPointDto.name = {
      "ar": updateTouchPointDto.name_ar,
      "en": updateTouchPointDto.name_en,
    };
    delete updateTouchPointDto.name_ar;
    delete updateTouchPointDto.name_en;
    if (file) {
      avatar = await this.filesAzureService.uploadFile(file, 'users');
    }
    console.log(JSON.stringify(updateTouchPointDto));
    await this.touchpointRepository.update(id, {
      ...updateTouchPointDto,
      avatar,
    });
  }
  // Delete a touchpoint by ID
  async remove(id: string): Promise<void> {
    const touchPoint = await this.findOne(id); // Check if the touchpoint exists
    await this.touchpointRepository.remove(touchPoint);
  }

  async findHighestRated() {
    const highestRatedTouchPoint = await this.touchpointRepository
      .createQueryBuilder('touchpoint')
      .leftJoinAndSelect('touchpoint.category', 'category')
      .orderBy('touchpoint.rating', 'DESC')
      .addOrderBy('touchpoint.countTransaction', 'DESC') // Tie-breaker if ratings are the same
      .getOne();

    if (!highestRatedTouchPoint) {
      throw new NotFoundException('No touchpoints found');
    }

    return highestRatedTouchPoint;
  }

  // Get the touchpoint with the lowest rating
  async findLowestRated() {
    const lowestRatedTouchPoint = await this.touchpointRepository
      .createQueryBuilder('touchpoint')
      .leftJoinAndSelect('touchpoint.category', 'category')
      .orderBy('touchpoint.rating', 'ASC')
      .addOrderBy('touchpoint.countTransaction', 'ASC') // Tie-breaker if ratings are the same
      .getOne();

    if (!lowestRatedTouchPoint) {
      throw new NotFoundException('No touchpoints found');
    }

    return lowestRatedTouchPoint;
  }
}
