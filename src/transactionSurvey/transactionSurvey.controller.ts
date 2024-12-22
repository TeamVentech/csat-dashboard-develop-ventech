import {
  Controller, Get, Post, Body, Patch, Param, Delete, Query,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { TransactionSurveyService } from './transactionSurvey.service';
import { CreateTransactionSurveyDto } from './dto/create.dto';
import { UpdateTransactionSurveyDto } from './dto/update.dto';
import { TransformInterceptor } from '../interceptors/transform.interceptor';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../guards/permissions.guard';
import { Permissions } from '../decorator/permissions.decorator';

@Controller('Transaction_survey')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@UseInterceptors(ClassSerializerInterceptor)
@UseInterceptors(TransformInterceptor)
export class TransactionSurveyController {
  constructor(private readonly transactionSurveyService: TransactionSurveyService) { }

  @Post()
  @Permissions('Survey::write')
  create(@Body() createTransactionSurveyDto: CreateTransactionSurveyDto) {
    return this.transactionSurveyService.create(createTransactionSurveyDto);
  }

  @Get()
  @Permissions('Survey::read')
  findAll(
    @Query('page') page: number,
    @Query('perPage') perPage: number,
    @Query('search') search?: string,
  ) {
    const filterOptions = {
      search
    };
    return this.transactionSurveyService.findAll(page, perPage, filterOptions);
  }

  @Get('survey/:surveyId/search/state')
  findAllState(
    @Param('surveyId') surveyId: string,
    @Query('page') page: number,
    @Query('perPage') perPage: number,
    @Query('search') search?: string,
  ) {
    const filterOptions = {
      search
    };
    return this.transactionSurveyService.findAllState(page, perPage, filterOptions, surveyId);
  }
  @Get(':id')
  @Permissions('Survey::read')
  findOne(@Param('id') id: string) {
    return this.transactionSurveyService.findOne(id);
  }

  @Get('survey/:id')
  @Permissions('Survey::read')
  findOneServey(@Param('id') id: string) {
    return this.transactionSurveyService.findOneServey(id);
  }

  @Patch(':id')
  @Permissions('Survey::update')
  update(@Param('id') id: string, @Body() updateTransactionSurveyDto: UpdateTransactionSurveyDto) {
    return this.transactionSurveyService.update(id, updateTransactionSurveyDto);
  }

  @Delete(':id')
  @Permissions('Survey::delete')
  remove(@Param('id') id: string) {
    return this.transactionSurveyService.remove(id);
  }

  @Get('survey/:id/report')
  report(@Param('id') id: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('filter') filter?: string,
    @Query('category') category?: string,
    @Query('touchpoint') touchpoint?: string,) {
    return this.transactionSurveyService.reportData(id, from, to, filter, category, touchpoint);
  }

  @Get('survey/:id/report/most-touchpoint')
  reportMostTouchPoint(@Param('id') id: string,
    @Query('filter') filter?: string,) {
    // return this.transactionSurveyService.reportMostTouchPoint(id, filter);
  }

  @Get('average/report')
  async getAverageTouchpointsForSurvey() {
    return this.transactionSurveyService.getAverageTouchpointsForSurvey();
  }

  @Get('report/date')
  async getAverageTouchpointsDate(
    @Query('from') from: string,
    @Query('to') to: string
  ) {
    return this.transactionSurveyService.getAverageTouchpointsDate(from, to);
  }

  @Get('ratings/questions')
  async getRatings(
    @Query('surveyId') surveyId: string,
    @Query('categoryId') categoryId: string,
    @Query('touchPointId') touchPointId: string,
  ) {
    return this.transactionSurveyService.getRatingsBySurveyCategoryAndTouchPoint(
      surveyId,
      categoryId,
      touchPointId,
    );
  }

  @Get('ratings/filteration')
  async getRatingsFilter(
    @Query('categoryId') categoryId?: string,
    @Query('touchPointId') touchPointId?: string,
    @Query('customerAge') customerAge?: string,
    @Query('customerGender') customerGender?: string,
    @Query('fromDate') fromDate?: Date,
    @Query('toDate') toDate?: Date,
  ) {
    const filters = {
      categoryId,
      touchPointId,
      customerAge,
      customerGender,
      dateRange: fromDate && toDate ? { from: new Date(fromDate), to: new Date(toDate) } : undefined,
    };

    return this.transactionSurveyService.getRatings(filters);
  }


  @Get('customers/surveys')
  async getCustomerSurvey(
    @Query('cutomerId') cutomerId?: string,
  ) {
    const filters = {
      cutomerId
    };

    return this.transactionSurveyService.getCustomerSurvey(filters);
  }

}
