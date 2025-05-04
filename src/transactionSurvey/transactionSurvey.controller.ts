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
import { ElasticService } from '../ElasticSearch/elasticsearch.service';
@Controller('Transaction_survey')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@UseInterceptors(ClassSerializerInterceptor)
@UseInterceptors(TransformInterceptor)
export class TransactionSurveyController {
  constructor(private readonly transactionSurveyService: TransactionSurveyService, private readonly elasticSearchService: ElasticService) { }

  @Post()
  create(@Body() createTransactionSurveyDto: CreateTransactionSurveyDto) {
    return this.transactionSurveyService.create(createTransactionSurveyDto);
  }

  @Get()
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
  
  @Get('search')
  async searchSurveyTransactions(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 10,
    @Query('state') state?: string,
    @Query('rating') rating?: string,
    @Query('surveyId') surveyId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('touchpointId') touchpointId?: string,
    @Query('customerId') customerId?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    const query = {
      state,
      rating,
      surveyId,
      categoryId,
      touchpointId,
      customerId,
      fromDate,
      toDate
    };
    
    return this.transactionSurveyService.searchSurveyTransactions(query, page, pageSize);
  }
  
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.transactionSurveyService.findOne(id);
  }

  @Post('search/query')
  elasticSerchQurey(
    @Body() data: any,
  ) {
    return this.elasticSearchService.search("survey_transactions", data.query, data.page, data.perPage);
  }

  
  @Get('survey/:id')
  findOneServey(@Param('id') id: string) {
    return this.transactionSurveyService.findOneServey(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTransactionSurveyDto: UpdateTransactionSurveyDto) {
    return this.transactionSurveyService.update(id, updateTransactionSurveyDto);
  }

  @Delete(':id')
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
