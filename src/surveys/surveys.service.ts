/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prettier/prettier */
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Surveys } from './entities/Surveys.entity';
import { CreateSurveysDto } from './dto/create.dto';
import { UpdateSurveysDto } from './dto/update.dto';

@Injectable()
export class SurveysService {
  constructor(
    @Inject('SURVEYS_REPOSITORY')
    private readonly SurveysRepository: Repository<Surveys>,
  ) {}

  async create(createSurveysDto: any) {
    const Surveys = this.SurveysRepository.create(createSurveysDto);
    return this.SurveysRepository.save(Surveys);
  }

  async findAll(page, perPage, filterOptions) {
    page = page || 1;
    perPage = perPage || 10;
    const queryBuilder = this.SurveysRepository.createQueryBuilder('user');

    // Apply filters based on filterOptions
    if (filterOptions) {
      if (filterOptions.search) {
        const searchString =await filterOptions.search.startsWith(' ')
          ? filterOptions.search.replace(' ', '+')
          : filterOptions.search;
        filterOptions.search = searchString
        queryBuilder.andWhere('(user.name ILIKE :search)', {
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
    const Surveys = await this.SurveysRepository.findOne({ where: { id: id } });
    if (!Surveys) {
      throw new NotFoundException(`Surveys with ID ${id} not found`);
    }
    return Surveys;
  }


  async reportData(id: string, from: string, to: string, filter:string) {
    const queryBuilder = this.SurveysRepository.createQueryBuilder('survey');
  
    queryBuilder.where('survey.id = :id', { id });
  
    // Filter by date range
    if (from && to) {
      queryBuilder.andWhere('survey.createdAt BETWEEN :from AND :to', { from, to });
    } else if (from) {
      queryBuilder.andWhere('survey.createdAt >= :from', { from });
    } else if (to) {
      queryBuilder.andWhere('survey.createdAt <= :to', { to });
    }
  
    // Select and group data based on the filter
    switch (filter) {
      case 'daily':
        queryBuilder
          .select("DATE(survey.createdAt) as date")
          .addSelect("COUNT(*) as value")
          .groupBy("DATE(survey.createdAt)")
          .orderBy("DATE(survey.createdAt)", "ASC");
        break;
      case 'weekly':
        queryBuilder
          .select("TO_CHAR(DATE_TRUNC('week', survey.createdAt), 'YYYY-MM-DD') as date")
          .addSelect("COUNT(*) as value")
          .groupBy("DATE_TRUNC('week', survey.createdAt)")
          .orderBy("DATE_TRUNC('week', survey.createdAt)", "ASC");
        break;
      case 'monthly':
        queryBuilder
          .select("TO_CHAR(DATE_TRUNC('month', survey.createdAt), 'YYYY-MM-DD') as date")
          .addSelect("COUNT(*) as value")
          .groupBy("DATE_TRUNC('month', survey.createdAt)")
          .orderBy("DATE_TRUNC('month', survey.createdAt)", "ASC");
        break;
      default:
        throw new Error('Invalid filter type. Use daily, weekly, or monthly.');
    }
  
    const data = await queryBuilder.getRawMany();
  
    if (!data.length) {
      throw new NotFoundException(
        `No survey data found for ID ${id} within the specified date range.`,
      );
    }
  
    return data.map(row => ({ date: row.date, value: Number(row.value) }));
  }

  // Update a Surveys by ID
  async update(id: string, updateSurveysDto: any) {
    const survey = await this.findOne(id);
    if(updateSurveysDto.metadata){
      survey.metadata.questions = updateSurveysDto.metadata.questions
    }
    survey.name = updateSurveysDto?.name
    survey.brief = updateSurveysDto?.brief
    survey.state = updateSurveysDto?.state
    await this.SurveysRepository.update(id, survey);
    return this.findOne(id);
  }

  async remove(id: string) {
    const Surveys = await this.findOne(id);
    await this.SurveysRepository.remove(Surveys);
  }
}
