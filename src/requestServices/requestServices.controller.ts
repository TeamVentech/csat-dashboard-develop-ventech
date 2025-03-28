import {
  Controller, Get, Post, Body, Patch, Param, Delete, Query,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
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

@Controller('request-services')
@UseInterceptors(ClassSerializerInterceptor)
@UseInterceptors(TransformInterceptor)
export class RequestServicesController {
  constructor(private readonly requestServicesService: RequestServicesService, private readonly elasticSearchService: ElasticService) { }

  @Post()
  @Permissions('Service::write')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  create(@Body() createRequestServicesDto: any) {
    return this.requestServicesService.create(createRequestServicesDto);
  }

  @Post('added-value-service')
  @Permissions('Service::write')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  addedValueService(@Body() createRequestServicesDto: AddedValueServiceDto) {
    return this.requestServicesService.addedValueService(createRequestServicesDto);
  }


  @Get()
  @Permissions('Service::read')
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
  @Permissions('Service::read')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  findOne(@Param('id') id: string) {
    return this.requestServicesService.findOne(id);
  }

  @Get('type/:type')
  @Permissions('Service::read')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  findType(@Param('type') type: string) {
    return this.requestServicesService.findType(type);
  }

  @Patch(':id')
  @Permissions('Service::update')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  update(@Param('id') id: string, @Body() updateRequestServicesDto: any) {
    return this.requestServicesService.update(id, updateRequestServicesDto);
  }

  

  @Patch(':id/rating')
  rating(@Param('id') id: string, @Body() rate: any) {
    return this.requestServicesService.rating(id, rate);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions('Service::delete')
  remove(@Param('id') id: string) {
    return this.requestServicesService.remove(id);
  }
  @Post('search/query')
  @Permissions('Service::read')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  elasticSerchQurey(@Body() data: any) {
    return this.elasticSearchService.search("services", data.search, data.page, data.perPage);
  }
  @Post('search/query/customer')
  @Permissions('Service::read')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  elasticCustomerSerchQurey(@Body() data: any) {
    return this.elasticSearchService.customer_search("services", data.search, data.page, data.perPage);
  }

  @Get('search/query/count')
  @Permissions('Service::read')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  getRecordsCount() {
    return this.elasticSearchService.getRecordsCount() as any;
  }
}
