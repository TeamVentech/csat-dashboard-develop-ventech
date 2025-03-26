import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SurveyTouchpoint } from './entities/survey-touchpoint.entity';
import { CreateSurveyTouchpointDto } from './dto/create.dto';
import { UpdateSurveyTouchpointDto } from './dto/update.dto';

@Injectable()
export class SurveyTouchpointService {
  constructor(
    @InjectRepository(SurveyTouchpoint)
    private readonly surveyTouchpointRepository: Repository<SurveyTouchpoint>,
  ) {}

  async create(createSurveyTouchpointDto: CreateSurveyTouchpointDto) {
    const surveyTouchpoint = this.surveyTouchpointRepository.create(createSurveyTouchpointDto);
    return this.surveyTouchpointRepository.save(surveyTouchpoint);
  }

  async findAll() {
    return this.surveyTouchpointRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOne(id: string) {
    const surveyTouchpoint = await this.surveyTouchpointRepository.findOne({
      where: { id },
    });
    if (!surveyTouchpoint) {
      throw new NotFoundException(`Survey touchpoint with ID ${id} not found`);
    }
    return surveyTouchpoint;
  }

  async findBySurveyId(surveyId: string) {
    const surveyTouchpoints = await this.surveyTouchpointRepository.find({
      where: { surveyId },
      order: {
        createdAt: 'DESC',
      },
    });
    
    if (!surveyTouchpoints.length) {
      throw new NotFoundException(`No survey touchpoints found for survey ID ${surveyId}`);
    }
    
    return surveyTouchpoints;
  }

  async update(id: string, updateSurveyTouchpointDto: UpdateSurveyTouchpointDto) {
    const surveyTouchpoint = await this.findOne(id);
    Object.assign(surveyTouchpoint, updateSurveyTouchpointDto);
    return this.surveyTouchpointRepository.save(surveyTouchpoint);
  }

  async remove(id: string) {
    const surveyTouchpoint = await this.findOne(id);
    return this.surveyTouchpointRepository.remove(surveyTouchpoint);
  }
} 