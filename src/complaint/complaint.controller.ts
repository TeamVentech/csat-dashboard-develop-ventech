import { Controller, Get, Post, Body, Patch, Param, Delete, Query,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,

 } from '@nestjs/common';
import { ComplaintsService } from './complaint.service';
import { CreateComplaintServicesDto } from './dto/create.dto';
import { UpdateComplaintServicesDto } from './dto/update.dto';
import { TransformInterceptor } from '../interceptors/transform.interceptor';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../guards/permissions.guard';
import { Permissions } from '../decorator/permissions.decorator';
import { ElasticService } from 'ElasticSearch/elasticsearch.service';

@Controller('complaint')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@UseInterceptors(ClassSerializerInterceptor)
@UseInterceptors(TransformInterceptor)
export class ComplaintsController {
  constructor(private readonly complaintsService: ComplaintsService,
    private readonly elasticSearchService: ElasticService

  ) {}

  @Post()
  @Permissions('Customer Care Center::write')
  create(@Body() CreateComplaintServicesDto: any) {
    return this.complaintsService.create(CreateComplaintServicesDto);
  }

  // @Get()
  // // @Permissions('Service::read')
  // findAll(
  //   @Query('page') page: number,
  //   @Query('perPage') perPage: number,
  //   @Query('search') search?: string,
  // ) {
  //   const filterOptions = {
  //     search
  // };
  //   return this.complaintsService.findAll(page, perPage, filterOptions);
  // }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.complaintsService.findOne(id);
  }

  @Get('type/:type')
  findType(@Param('type') type: string) {
    return this.complaintsService.findType(type);
  }

  @Patch(':id')
  @Permissions('Customer Care Center::update')
  update(@Param('id') id: string, @Body() UpdateComplaintServicesDto: UpdateComplaintServicesDto) {
    return this.complaintsService.update(id, UpdateComplaintServicesDto);
  }

  @Delete(':id')
  @Permissions('Customer Care Center::delete')
  remove(@Param('id') id: string) {
    const ids = id.split(',');
    return this.complaintsService.removeMultiple(ids);
  }
  @Post('search/query')
  elasticSerchQurey(
    @Body() data: any,
  ) {
    return this.elasticSearchService.search("complaints", data.query, data.page, data.perPage);
  }

  @Get('customers/:id/complaint')
  async getCustomerSurvey(
    @Param('id') id: string,
    @Query('page') page: number,
    @Query('perPage') perPage: number,

  ) {
    return this.elasticSearchService.getCustomerSurvey("complaints",id, page, perPage);
  }

}
