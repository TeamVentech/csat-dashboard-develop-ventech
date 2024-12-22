import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Section } from './entities/Sections.entity';
import { CreateSectionDto } from './dto/create.dto';
import { UpdateSectionDto } from './dto/update.dto';

@Injectable()
export class SectionsService {
  constructor(
    @Inject('SECTIONS_REPOSITORY')
    private readonly sectionRepository: Repository<Section>,
  ) {}

  async create(createSectionDto: CreateSectionDto) {
    const Section = this.sectionRepository.create(createSectionDto);
    return this.sectionRepository.save(Section);
  }

  async findAll(page, perPage, filterOptions) {
    page = page || 1;
    perPage = perPage || 10;
    const queryBuilder = this.sectionRepository.createQueryBuilder('user');

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

    const [categories, total] = await queryBuilder
      .skip((page - 1) * perPage)
      .take(perPage)
      .getManyAndCount();

    return { categories, total };
  }

  async findOne(id: string){
    const Section = await this.sectionRepository.findOne({ where: { id: id } });
    if (!Section) {
      throw new NotFoundException(`Section with ID ${id} not found`);
    }
    return Section;
  }

  async findallwithoutfilter(){
    const Section = await this.sectionRepository.find();
    if (!Section) {
      throw new NotFoundException(`Section with not found`);
    }
    return Section;
  }

  async update(id: string, updateSectionDto: UpdateSectionDto) {
    await this.findOne(id);
    await this.sectionRepository.update(id, updateSectionDto);
    return this.findOne(id);
  }

  async remove(id: string) {
    const Section = await this.findOne(id);
    await this.sectionRepository.remove(Section);
  }
}
