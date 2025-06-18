import {
  Controller, Get, Post, Body, Patch, Param, Delete, Query,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
  ValidationPipe,
} from '@nestjs/common';
import { RequestServicesService } from './requestServices.service';
import { CreateRequestServicesDto } from './dto/create.dto';
import { UpdateRequestServicesDto } from './dto/update.dto';
import { TransformInterceptor } from '../interceptors/transform.interceptor';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../guards/permissions.guard';
import { Permissions } from '../decorator/permissions.decorator';
import { ElasticService } from 'ElasticSearch/elasticsearch.service';
import { AddedValueServiceDto } from './dto/added-value-service.dto';
import { CheckActiveServiceDto } from './dto/check-active-service.dto';
import { LostChildChartDto } from './dto/lost-child-chart.dto';
import { LostChildLocationChartDto } from './dto/lost-child-location-chart.dto';
import { LostChildDurationDto } from './dto/lost-child-duration.dto';
import { SuggestionChartDto } from './dto/suggestion-chart.dto';
import { AdditionalPickupRequestHandfreeDto } from './dto/additional-pickup-request-handfree.dto';


@Controller('request-services')
@UseInterceptors(ClassSerializerInterceptor)
@UseInterceptors(TransformInterceptor)
export class RequestServicesController {
  constructor(private readonly requestServicesService: RequestServicesService, private readonly elasticSearchService: ElasticService) { }

  @Post()
  @Permissions('Customer Care Center::write')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  create(@Body() createRequestServicesDto: any) {
    return this.requestServicesService.create(createRequestServicesDto);
  }

  @Post('added-value-service')
  @Permissions('Customer Care Center::write')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  addedValueService(@Body() createRequestServicesDto: AddedValueServiceDto) {
    return this.requestServicesService.addedValueService(createRequestServicesDto);
  }

  @Post('added-value-service-handfree')
  @Permissions('Customer Care Center::write')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  addedValueServiceHandFree(@Body() createRequestServicesDto: any) {
    return this.requestServicesService.addedValueServiceHandFree(createRequestServicesDto);
  }


  @Get()
  @Permissions('Customer Care Center::read')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  findAll(
    @Query('page') page: number,
    @Query('perPage') perPage: number,
    @Query('search') search?: string,
  ) {
    const filterOptions = {
      search
    };
    return this.requestServicesService.findAll(page, perPage, filterOptions);
  }

  @Get(':id')
  @Permissions('Customer Care Center::read')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  findOne(@Param('id') id: string) {
    return this.requestServicesService.findOne(id);
  }

  @Get('type/:type')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  findType(@Param('type') type: string) {
    return this.requestServicesService.findType(type);
  }

  @Patch(':id')
  @Permissions('Customer Care Center::update')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  update(@Param('id') id: string, @Body() updateRequestServicesDto: any) {
    return this.requestServicesService.update(id, updateRequestServicesDto);
  }

  @Patch('add-additional-pickup-request-handfree/:id')
  @Permissions('Customer Care Center::update')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  additionalPickupRequestHandfree(
    @Param('id') id: string,
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) body: AdditionalPickupRequestHandfreeDto
  ) {
    return this.requestServicesService.additionalPickupRequestHandfree(id, body);
  }

  @Patch(':id/rating')
  rating(@Param('id') id: string, @Body() rate: any) {
    return this.requestServicesService.rating(id, rate);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions('Customer Care Center::delete')
  remove(@Param('id') id: string) {
    return this.requestServicesService.remove(id);
  }

  @Post('search/query')  elasticSerchQurey(@Body() data: any) {
    return this.elasticSearchService.search("services", data.search, data.page, data.perPage);
  }

  @Post('search/query/customer')
  elasticCustomerSerchQurey(@Body() data: any) {
    return this.elasticSearchService.customer_search("services", data.search, data.page, data.perPage);
  }

  @Get('search/query/count')
  getRecordsCount() {
    return this.elasticSearchService.getRecordsCount() as any;
  }

  @Post('check-active-service')
  @Permissions('Customer Care Center::read')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  checkActiveService(@Body() checkActiveServiceDto: CheckActiveServiceDto) {
    return this.requestServicesService.checkActiveServicesByType(
      checkActiveServiceDto.type,
      checkActiveServiceDto.phoneNumber
    );
  }

  @Post('lost-child/chart')
  @Permissions('Customer Care Center::read')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  getLostChildChartData(@Body() filters: LostChildChartDto) {
    return this.elasticSearchService.getLostChildChartData(filters);
  }

  @Post('lost-child/location-chart')
  @Permissions('Customer Care Center::read')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  getLostChildLocationChartData(@Body() filters: LostChildLocationChartDto) {
    return this.elasticSearchService.getLostChildLocationChartData(filters);
  }

  @Post('lost-child/duration')
  @Permissions('Customer Care Center::read')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  getLostChildDurationData(@Body() filters: LostChildDurationDto) {
    return this.elasticSearchService.getLostChildDurationData(filters);
  }

  @Post('suggestion/chart')
  @Permissions('Customer Care Center::read')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  getSuggestionChartData(@Body() filters: SuggestionChartDto) {
    return this.elasticSearchService.getSuggestionChartData(filters);
  }
}
