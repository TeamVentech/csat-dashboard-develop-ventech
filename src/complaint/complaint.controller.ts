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
// @UseGuards(AuthGuard('jwt'), PermissionsGuard)
// @UseInterceptors(ClassSerializerInterceptor)
// @UseInterceptors(TransformInterceptor)
export class ComplaintsController {
  constructor(private readonly complaintsService: ComplaintsService,
    private readonly elasticSearchService: ElasticService

  ) {}

  @Post()
  // @Permissions('Complaint::write')
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
  // @Permissions('Service::read')
  findOne(@Param('id') id: string) {
    return this.complaintsService.findOne(id);
  }

  @Get('type/:type')
  // @Permissions('Service::read')
  findType(@Param('type') type: string) {
    return this.complaintsService.findType(type);
  }

  @Patch(':id')
  // @Permissions('Service::update')
  update(@Param('id') id: string, @Body() UpdateComplaintServicesDto: UpdateComplaintServicesDto) {
    return this.complaintsService.update(id, UpdateComplaintServicesDto);
  }

  @Delete(':id')
  // @Permissions('Service::delete')
  remove(@Param('id') id: string) {
    return this.complaintsService.remove(id);
  }
  @Post('search/query')
  @Permissions('Service::read')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  elasticSerchQurey(
    @Body() data: any,
  ) {
    console.log(data)
    return this.elasticSearchService.search("complaints", data.query, data.page, data.perPage);
  }
}
