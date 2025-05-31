/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prettier/prettier */
import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Surveys } from './entities/Surveys.entity';
import { CreateSurveysDto } from './dto/create.dto';
import { UpdateSurveyDetailsDto, UpdateSurveysDto } from './dto/update.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SurveysService {
  constructor(
    @Inject('SURVEYS_REPOSITORY')
    private readonly SurveysRepository: Repository<Surveys>,
  ) {}

  async create(createSurveysDto: any) {
    try {
      const survey = await this.SurveysRepository.create(createSurveysDto);
      await this.SurveysRepository.save(survey);
      return survey;
    } catch (error) {
      console.log(error)
      throw new BadRequestException(error.message)
    }
  }

  async findAll(page, perPage, filterOptions) {
    page = page || 1;
    perPage = perPage || 10;
    const queryBuilder = this.SurveysRepository.createQueryBuilder('user');

    // Apply filters based on filterOptions
    if (filterOptions) {
      if (filterOptions.search) {
        queryBuilder.andWhere('("user"."name" ILIKE :search OR "user"."id"::text ILIKE :search)', {
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

  async updateSurveyDetails(id: string, updateSurveyDetailsDto: UpdateSurveyDetailsDto){
    try {
      const survey = await this.findOne(id);
      survey.name = updateSurveyDetailsDto.name;
      survey.brief = updateSurveyDetailsDto.brief;
      survey.state = updateSurveyDetailsDto.state
      await this.SurveysRepository.update(id, survey);
      return {
        message: 'Survey details updated successfully',
        statusCode: 200
      }
    } catch (error) {
      console.log(error)
      return {
        message: 'Survey details update failed',
        statusCode: 500
      }
    }
  }

  // Update a Surveys by ID
  async update(id: string, updateSurveysDto: any) {
    const survey = await this.findOne(id);
    if(updateSurveysDto.metadata){
      survey.metadata.questions = updateSurveysDto.metadata.questions
    }
    for(let i = 0; i < updateSurveysDto.metadata.questions.length; i++){
      if(!updateSurveysDto.metadata.questions[i].id){
          updateSurveysDto.metadata.questions[i].id = uuidv4()
      }
    }
    survey.name = updateSurveysDto?.name
    survey.brief = updateSurveysDto?.brief
    survey.state = updateSurveysDto?.state
    await this.SurveysRepository.update(id, survey);
    return this.findOne(id);
  }
  async updateMainTouchpoint(id: string, updateSurveysTouchpointDto: any) {
    const survey = await this.findOne(id);
    survey.metadata.mainTouchpoint = updateSurveysTouchpointDto?.mainTouchpoint
    const result = await this.SurveysRepository.update(id, survey);
    return this.findOne(id);
  }

  async getSurveysTouchpoint(mainTouchpoint: string) {
    const touchpoint = await this.SurveysRepository
      .createQueryBuilder('survey')
      .where("survey.metadata->>'mainTouchpoint' = :mainTouchpoint", { 
        mainTouchpoint: mainTouchpoint 
      })
      .getMany();
    
    return touchpoint;
  }

  async remove(id: string) {
    const Surveys = await this.findOne(id);
    await this.SurveysRepository.remove(Surveys);
  }

  async removeMultiple(ids: string[]) {
    const results = [];
    
    for (const id of ids) {
      try {
        const survey = await this.findOne(id);
        await this.SurveysRepository.remove(survey);
        results.push({ id, success: true });
      } catch (error) {
        results.push({ id, success: false, message: error.message });
      }
    }
    
    return {
      message: 'Surveys deletion completed',
      results
    };
  }
}
