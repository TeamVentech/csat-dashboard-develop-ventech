import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SurveyTouchpointService } from './survey-touchpoint.service';
import { CreateSurveyTouchpointDto } from './dto/create.dto';
import { UpdateSurveyTouchpointDto } from './dto/update.dto';

@Controller('survey-touchpoints')
export class SurveyTouchpointController {
  constructor(private readonly surveyTouchpointService: SurveyTouchpointService) {}

  @Post()
  create(@Body() createSurveyTouchpointDto: CreateSurveyTouchpointDto) {
    return this.surveyTouchpointService.create(createSurveyTouchpointDto);
  }

  @Get()
  findAll() {
    return this.surveyTouchpointService.findAll();
  }

  @Get('survey/:surveyId')
  findBySurveyId(@Param('surveyId') surveyId: string) {
    return this.surveyTouchpointService.findBySurveyId(surveyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.surveyTouchpointService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSurveyTouchpointDto: UpdateSurveyTouchpointDto) {
    return this.surveyTouchpointService.update(id, updateSurveyTouchpointDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.surveyTouchpointService.remove(id);
  }
} 